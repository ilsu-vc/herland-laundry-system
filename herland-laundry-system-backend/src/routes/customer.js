const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// ─── Table schema (from Supabase error details) ────────────────────────────────
// bookings: id, user_id, service_type (NOT NULL), status, schedule (timestamptz),
//           created_at, reference_number, stage (CHECK: received|payment|preparation|shipping|final|done),
//           timeline (jsonb), service_details (jsonb), collection_details (jsonb),
//           payment_details (jsonb), notes, collection_option

// ─── Public Services Route ───────────────────────────────────────────────────
router.get('/services', async (req, res) => {
    try {
        const { data: items, error: itemsError } = await supabase
            .from('service_items')
            .select('*')
            .order('sort_order', { ascending: true });

        if (itemsError) throw itemsError;

        const { data: scheduleRows, error: schedError } = await supabase
            .from('shop_schedule')
            .select('*')
            .limit(1);

        if (schedError) throw schedError;

        const services = (items || [])
            .filter(i => i.type === 'service')
            .map(i => ({
                id: i.id,
                name: i.name,
                currentPrice: Number(i.current_price),
            }));

        const addOns = (items || [])
            .filter(i => i.type === 'addon')
            .map(i => ({
                id: i.id,
                name: i.name,
                currentPrice: Number(i.current_price),
            }));

        res.json({ services, addOns, schedule: scheduleRows?.[0] || null });
    } catch (error) {
        console.error('Fetch Services Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// ─── Create a booking ──────────────────────────────────────────────────────────
router.post('/book', requireAuth, async (req, res) => {
    const {
        reference_number,
        collection_option,
        service_details,
        collection_details,
        payment_details,
        notes,
    } = req.body;

    if (!reference_number) {
        return res.status(400).json({ error: 'Missing reference number' });
    }

    try {
        // Fetch user role to verify they are a Customer
        const { data: profile, error: roleError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (roleError || !profile || (profile.role !== 'Customer' && profile.role !== 'Admin')) {
            return res.status(403).json({ error: 'Only customers can create bookings.' });
        }

        const nowIso = new Date().toISOString();

        // Build a human-readable service_type string
        const serviceNames =
            service_details?.selectedServices?.join(', ') || 'Laundry Service';

        // ─── Double Booking Prevention ──────────────────────────────────────────
        const collectionDate = collection_details?.collectionDate;
        const collectionTime = collection_details?.collectionTime;

        if (collectionDate && collectionTime) {
            const { data: existing, error: checkError } = await supabase
                .from('bookings')
                .select('id')
                .eq('collection_details->>collectionDate', collectionDate)
                .eq('collection_details->>collectionTime', collectionTime)
                .neq('status', 'cancelled')
                .maybeSingle();

            if (checkError) {
                console.error('Check double booking error:', checkError);
            }

            if (existing) {
                return res.status(400).json({ 
                    error: 'This time slot is already booked. Please choose another time.' 
                });
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    user_id: req.user.id,
                    service_type: serviceNames,
                    status: 'pending',
                    schedule: nowIso,
                    reference_number,
                    stage: 'received',
                    collection_option: collection_option || 'dropOffPickUpLater',
                    timeline: [{ status: 'Booking Received', timestamp: nowIso }],
                    service_details: service_details || null,
                    collection_details: collection_details || null,
                    payment_details: payment_details || null,
                    notes: notes || '',
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', JSON.stringify(error, null, 2));
            return res.status(500).json({ error: 'Failed to create booking. ' + error.message });
        }

        res.status(201).json({
            message: 'Booking created successfully!',
            booking: data,
        });

        // Send Notification
        notificationService.notify(req.user.id, 'BOOKING_CREATED', data.reference_number || data.id);
    } catch (error) {
        console.error('Error creating booking:', error.message || error);
        res.status(500).json({ error: 'Failed to create booking. Please try again.' });
    }
});

// ─── Helper: normalize a DB row into the frontend shape ─────────────────────────
function normalizeBooking(b) {
    return {
        id: b.reference_number || b.id,
        dbId: b.id,
        userId: b.user_id,
        customerName: b.service_type || 'Laundry Service',
        date: b.created_at
            ? new Date(b.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })
            : '-',
        collectionOption: b.collection_option || 'dropOffPickUpLater',
        stage: b.stage || 'received',
        timeline: b.timeline || [
            { status: 'Booking Received', timestamp: b.created_at || new Date().toISOString() },
        ],
        serviceDetails: b.service_details || null,
        collectionDetails: b.collection_details || null,
        paymentDetails: b.payment_details || null,
        status: b.status || 'pending',
        notes: b.notes || '',
    };
}

// ─── Get my bookings ────────────────────────────────────────────────────────────
router.get('/my-bookings', requireAuth, async (req, res) => {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (bookings || []).map(normalizeBooking);
        res.json(mapped);
    } catch (error) {
        console.error('Fetch My Bookings Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// ─── Helper: find a booking by reference_number or ID ──────────────────────────
async function getBookingByIdOrRef(id, userId, hasBypass = false) {
    // 1. Check if it's a numeric ID
    const isNumeric = /^\d+$/.test(id);
    
    let query = supabase.from('bookings').select('*');
    
    // 2. Build OR filter
    if (isNumeric) {
        query = query.or(`reference_number.eq.${id},id.eq.${id}`);
    } else {
        query = query.eq('reference_number', id);
    }

    // 3. Ownership check if not bypassed
    if (!hasBypass) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) console.error('[DEBUG] getBookingByIdOrRef error:', error);
    return data;
}

// ─── Get a single booking ──────────────────────────────────────────────────────
router.get('/my-bookings/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    console.log(`[DEBUG] Fetching booking: ${id} for user: ${req.user.id}`);

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .maybeSingle();

        const hasBypass = profile?.role === 'Admin' || profile?.role === 'Staff';
        const booking = await getBookingByIdOrRef(id, req.user.id, hasBypass);

        if (!booking) {
            console.log(`[DEBUG] Booking ${id} not found for user ${req.user.id}`);
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(normalizeBooking(booking));
    } catch (error) {
        console.error('Fetch Single Booking Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// ─── Update payment reference ──────────────────────────────────────────────────
router.post('/my-bookings/:id/payment-reference', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
        return res.status(400).json({ error: 'Reference number is required' });
    }

    try {
        const booking = await getBookingByIdOrRef(id, req.user.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const currentPayment = booking.payment_details || {};
        const updatedPayment = {
            ...currentPayment,
            referenceNumber: referenceNumber,
        };

        const { error: updateError } = await supabase
            .from('bookings')
            .update({ payment_details: updatedPayment })
            .eq('id', booking.id);

        if (updateError) throw updateError;

        res.json({ message: 'Payment reference updated successfully' });
    } catch (error) {
        console.error('Update Payment Reference Error:', error.message);
        res.status(500).json({ error: 'Failed to update payment reference' });
    }
});

// ─── Profile Management ────────────────────────────────────────────────────────
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .maybeSingle();

        if (error) throw error;

        res.json({
            id: req.user.id,
            email: req.user.email,
            phone: req.user.phone, // Auth phone
            full_name: profile?.full_name || '',
            profile_phone: profile?.phone_number || '', // Profile table phone
            role: profile?.role || 'Customer',
            avatar_url: profile?.avatar_url || null,
            address: profile?.address || ''
        });
    } catch (error) {
        console.error('Fetch Profile Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

router.put('/profile', requireAuth, async (req, res) => {
    const { name, phone, password, address } = req.body;

    try {
        // 1. Update Profile table
        const profileUpdate = {};
        if (name !== undefined) profileUpdate.full_name = name;
        if (phone !== undefined) profileUpdate.phone_number = phone;
        if (req.body.avatar_url !== undefined) profileUpdate.avatar_url = req.body.avatar_url;
        if (address !== undefined) profileUpdate.address = address;

        if (Object.keys(profileUpdate).length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdate)
                .eq('id', req.user.id);

            if (profileError) throw profileError;
        }

        // 2. Update Auth (Password/Phone if needed)
        const authUpdate = {};
        if (password) authUpdate.password = password;
        
        // If updating phone in auth, convert to E.164
        if (phone) {
            let e164Phone = String(phone);
            if (e164Phone.startsWith('0')) {
                e164Phone = '+63' + e164Phone.substring(1);
            }
            if (e164Phone.startsWith('+')) {
                authUpdate.phone = e164Phone;
            }
        }

        if (Object.keys(authUpdate).length > 0) {
            const { error: authError } = await supabase.auth.updateUser(authUpdate);
            if (authError) {
                console.warn('Auth update warning:', authError.message);
                if (password) throw authError;
            }
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update Profile Error:', error.message);
        res.status(500).json({ error: `Failed to update profile: ${error.message}` });
    }
});

// ─── Cancel a booking ─────────────────────────────────────────────────────────
router.patch('/my-bookings/:id/cancel', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const booking = await getBookingByIdOrRef(id, req.user.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status !== 'pending' && booking.status !== 'Booking Received') {
             // In some places status is 'pending', in others it might be the label. 
             // Let's be safe and check both or assume 'pending' is the DB value.
            if (booking.status.toLowerCase() !== 'pending') {
                return res.status(400).json({ error: 'Only pending bookings can be cancelled.' });
            }
        }

        const nowIso = new Date().toISOString();
        const updatedTimeline = [
            ...(booking.timeline || []),
            { status: 'Booking Cancelled', timestamp: nowIso }
        ];

        const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
                status: 'cancelled',
                timeline: updatedTimeline
            })
            .eq('id', booking.id);

        if (updateError) throw updateError;

        res.json({ message: 'Booking cancelled successfully' });

        // Send Notification
        notificationService.notify(req.user.id, 'CANCELLED', booking.reference_number || booking.id);
    } catch (error) {
        console.error('Cancel Booking Error:', error.message);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

// ─── Update a booking ──────────────────────────────────────────────────────────
router.patch('/my-bookings/:id/update', requireAuth, async (req, res) => {
    const { id } = req.params;
    const {
        service_details,
        collection_details,
        payment_details,
        notes,
        collection_option
    } = req.body;

    try {
        const booking = await getBookingByIdOrRef(id, req.user.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status.toLowerCase() !== 'pending') {
            return res.status(400).json({ error: 'Only pending bookings can be modified.' });
        }

        const nowIso = new Date().toISOString();
        const updatedTimeline = [
            ...(booking.timeline || []),
            { status: 'Booking Edited', timestamp: nowIso }
        ];

        // ─── Double Booking Prevention ──────────────────────────────────────────
        const collectionDate = collection_details?.collectionDate || booking.collection_details?.collectionDate;
        const collectionTime = collection_details?.collectionTime || booking.collection_details?.collectionTime;

        if (collectionDate && collectionTime) {
            const { data: existing, error: checkError } = await supabase
                .from('bookings')
                .select('id')
                .eq('collection_details->>collectionDate', collectionDate)
                .eq('collection_details->>collectionTime', collectionTime)
                .neq('status', 'cancelled')
                .neq('id', booking.id) // Exclude current booking
                .maybeSingle();

            if (checkError) {
                console.error('Check double booking error:', checkError);
            }

            if (existing) {
                return res.status(400).json({ 
                    error: 'The new time slot is already booked. Please choose another time.' 
                });
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        // Re-calculate service_type string
        const serviceNames = service_details?.selectedServices?.join(', ') || booking.service_type;

        const updatePayload = {
            timeline: updatedTimeline,
            service_type: serviceNames
        };

        if (service_details) updatePayload.service_details = service_details;
        if (collection_details) updatePayload.collection_details = collection_details;
        if (payment_details) updatePayload.payment_details = payment_details;
        if (notes !== undefined) updatePayload.notes = notes;
        if (collection_option) updatePayload.collection_option = collection_option;

        const { error: updateError } = await supabase
            .from('bookings')
            .update(updatePayload)
            .eq('id', booking.id);

        if (updateError) throw updateError;

        res.json({ message: 'Booking updated successfully' });

        // Send Notification
        notificationService.notify(req.user.id, 'UPDATED', booking.reference_number || booking.id);
    } catch (error) {
        console.error('Update Booking Error:', error.message);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// ─── Submit Feedback ──────────────────────────────────────────────────────────
router.patch('/my-bookings/:id/feedback', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    try {
        // Verify booking belongs to user and is completed
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('user_id, status, feedback')
            .eq('id', id)
            .single();

        if (fetchError || !booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const terminalStatuses = ['delivered', 'completed', 'Booking Completed'];
        if (!terminalStatuses.includes(booking.status)) {
            return res.status(400).json({ error: 'Feedback can only be provided for completed bookings' });
        }

        const feedbackData = {
            rating,
            comment,
            submitted_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('bookings')
            .update({ feedback: feedbackData })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ message: 'Feedback submitted successfully', booking: data });
    } catch (error) {
        console.error('Submit Feedback Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

