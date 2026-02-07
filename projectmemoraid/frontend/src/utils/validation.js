export const DISPOSABLE_EMAIL_DOMAINS = [
    'mailinator.com',
    'yopmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'tempmail.com',
    'trashmail.com',
    'getairmail.com',
    'sharklasers.com',
    'mailnesia.com',
    'dispostable.com'
];

export const isSpamEmail = (email) => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return DISPOSABLE_EMAIL_DOMAINS.includes(domain?.toLowerCase());
};

export const validatePasswordLength = (password) => {
    return password && password.length >= 8;
};

export const validatePhoneNumber = (phone) => {
    // Strictly 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};
