const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyRole } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// Route: Update booking status (e.g., pending -> washing -> ready)
router.patch('/update-status/:id', verifyRole('staff'), async (req, res) => {
    const { id } = req.params; // Get the booking ID from the URL
    const { new_status } = req.body; // Get the new status from the frontend

    // 1. List of valid statuses to prevent accidental typos in the database
    const validStatuses = ['pending', 'picked_up', 'washing', 'ready', 'Delivery in Progress', 'delivered'];

    if (!validStatuses.includes(new_status)) {
        return res.status(400).json({ error: 'Invalid status update' });
    }

    try {
        // 2. Update the specific booking in Supabase
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: new_status })
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