const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyRole } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// Route: Update booking status (e.g., pending -> washing -> ready)
router.patch('/update-status/:id', verifyRole('staff'), async (req, res) => {
    const { id } = req.params; // Get the booking ID from the URL
    const { new_status, timeline } = req.body; // Get the new status and timeline from the frontend

    // 1. List of valid statuses to prevent accidental typos in the database
    // Unified to support rider-specific statuses and legacy strings
    const validStatuses = [
        'pending', 'picked_up', 'washing', 'ready', 'Delivery in Progress', 'delivered', 'In Progress',
        'Picked Up from Customer', 'Laundry Delivered'
    ];

    if (!validStatuses.includes(new_status)) {
        return res.status(400).json({ error: 'Invalid status update' });
    }

    try {
        if (new_status === 'In Progress') {
            const { data: bData, error: fetchErr } = await supabase
                .from('bookings')
                .select('payment_details, downpayment_status')
                .eq('id', id)
                .single();
            
            if (!fetchErr && bData) {
                const pStatus = bData.payment_details?.status;
                const dpStatus = bData.downpayment_status || bData.payment_details?.downpayment_status;
                
                if (pStatus !== 'Payment Confirmed' && dpStatus !== 'verified') {
                    return res.status(400).json({ error: "Cannot transition to 'In Progress' until 25% downpayment or full payment proof is verified by staff." });
                }
            }
        }

        const updateData = { status: new_status };
        if (timeline) {
            updateData.timeline = timeline;
        }

        // 2. Update the specific booking in Supabase
        const { data, error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id)
            .select('*, profiles(full_name)')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Booking not found' });

        // 3. Success response
        res.json({
            message: `Order status successfully updated to ${new_status}`,
            updatedBooking: data
        });

        // 4. Send Notification
        let eventType = 'UPDATE';
        if (new_status === 'picked_up') eventType = 'BOOKING_ACCEPTED';
        else if (new_status === 'washing') eventType = 'WASHING';
        else if (new_status === 'ready') eventType = 'READY';
        else if (new_status === 'Delivery in Progress') eventType = 'DELIVERY';
        else if (new_status === 'delivered') eventType = 'COMPLETED';

        notificationService.notify(data.user_id, eventType, data.reference_number || data.id);

    } catch (error) {
        console.error('Staff Update Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;