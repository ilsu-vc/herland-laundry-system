const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyRole } = require('../middleware/auth');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * @route   GET /api/v1/rider/assigned-bookings
 * @desc    Get bookings assigned to the logged-in rider
 * @access  Rider
 */
router.get('/assigned-bookings', verifyRole('Rider'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('rider_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profiles for customer names
        const userIds = [...new Set((data || []).map(b => b.user_id).filter(Boolean))];
        let profilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (!profileError && profiles) {
                profilesMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
            }
        }

        const mapped = (data || []).map(b => ({
            ...b,
            customerName: profilesMap[b.user_id] || 'Unknown Customer'
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Rider Fetch Bookings Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   GET /api/v1/rider/accepted-bookings
 * @desc    Get all bookings that have been accepted and are ready for rider action
 * @access  Rider
 */
router.get('/accepted-bookings', verifyRole('Rider'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('status', 'Booking Accepted')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profiles for customer names
        const userIds = [...new Set((data || []).map(b => b.user_id).filter(Boolean))];
        let profilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (!profileError && profiles) {
                profilesMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
            }
        }

        const mapped = (data || []).map(b => ({
            ...b,
            customerName: profilesMap[b.user_id] || 'Unknown Customer'
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Rider Fetch Accepted Bookings Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   PATCH /api/v1/rider/update-status/:id
 * @desc    Update booking status for delivery flow
 * @access  Rider
 */
router.patch('/update-status/:id', verifyRole('Rider'), async (req, res) => {
    const { id } = req.params;
    const { new_status } = req.body;

    // Riders typically handle these statuses
    const validRiderStatuses = ['picked_up', 'ready_for_delivery', 'delivered'];

    if (!validRiderStatuses.includes(new_status)) {
        return res.status(400).json({ error: 'Invalid status update for Rider' });
    }

    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: new_status })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({
            message: `Order status successfully updated to ${new_status}`,
            updatedBooking: data[0]
        });
    } catch (error) {
        console.error('Rider Status Update Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
