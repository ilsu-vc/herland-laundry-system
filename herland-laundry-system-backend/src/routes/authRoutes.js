// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Register
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, phone, metadata } = req.body;
        
        // Prepare Supabase SignUp Options
        let signUpOptions = {
            password,
            options: {
                data: metadata,
            }
        };

        // If email is provided, use it
        if (email && email.trim() !== '') {
            signUpOptions.email = email;
            signUpOptions.options.emailRedirectTo = 'http://localhost:5173/login';
        } else if (phone) {
            // If no email, try phone. Supabase requires E.164 format (e.g., +639...)
            // Assuming input is 09xxxxxxxxx, convert to +639xxxxxxxxx
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('09')) cleanPhone = '63' + cleanPhone.substring(1);
            else if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) cleanPhone = '63' + cleanPhone;
            signUpOptions.phone = '+' + cleanPhone;
        } else {
            return res.status(400).json({ error: 'Email or Phone Number is required.' });
        }

        const { data, error } = await supabase.auth.signUp(signUpOptions);

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json({ message: 'User registered successfully', data });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return res.status(401).json({ error: error.message });
        res.status(200).json({ token: data.session.access_token, user: data.user });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email, phone } = req.body;
    try {
        if (email) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:5173/reset-password',
            });
            if (error) throw error;
            return res.status(200).json({ message: 'Password reset link sent to your email.' });
        } else if (phone) {
            // For phone, we send an OTP
            let cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('09')) cleanPhone = '63' + cleanPhone.substring(1);
            else if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) cleanPhone = '63' + cleanPhone;
            let formattedPhone = '+' + cleanPhone;
            
            const { error } = await supabase.auth.signInWithOtp({
                phone: formattedPhone,
            });
            if (error) throw error;
            return res.status(200).json({ message: 'OTP sent to your mobile number.' });
        } else {
            return res.status(400).json({ error: 'Email or phone number is required.' });
        }
    } catch (err) {
        console.error('Forgot Password Error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// Reset Password (assuming user is authenticated via link/otp)
router.post('/reset-password', async (req, res) => {
    const { password, access_token } = req.body;
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: password
        }, {
            access_token: access_token
        });
        
        if (error) throw error;
        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (err) {
        console.error('Reset Password Error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
