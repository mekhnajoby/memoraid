// Auth utility functions
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('access_token', token);
        // Also set as cookie for additional security
        document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Strict`;
    }
};

export const setRefreshToken = (token) => {
    if (token) {
        localStorage.setItem('refresh_token', token);
        document.cookie = `refresh_token=${token}; path=/; max-age=604800; SameSite=Strict`;
    }
};

export const setUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('isAuthenticated', 'true');
    }
};

export const getAuthToken = () => {
    return localStorage.getItem('access_token');
};

export const getUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error("Failed to parse user from storage", e);
        return null;
    }
};

export const isAuthenticated = () => {
    return !!getAuthToken() && !!sessionStorage.getItem('isAuthenticated');
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');

    // Clear cookies
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
};

export const preventBackNavigation = () => {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
        window.history.pushState(null, '', window.location.href);
    };
};
