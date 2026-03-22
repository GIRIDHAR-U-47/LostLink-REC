export const COLORS = {
    primary: '#671B95', // Deep Royal Purple
    idark: '#4A148C',   // Darker Purple
    muted: '#7C3AED',   // Medium Purple
    light: '#E9D5FF',   // Light Purple Background
    lavender: '#F3E8FF', // Very Light Purple
    pastel: '#FAF5FF',  // Almost White Purple
    shadow: '#2E1065',  // Deepest Purple/Shadow
    accent: '#D8B4FE',  // Accent Lilac

    // Standard colors
    white: '#ffffff',
    background: '#FFFFFF',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6'
};

export const SIZES = {
    // Global sizes
    base: 8,
    font: 14,
    radius: 12,
    padding: 24,

    // Font Sizes
    h1: 30,
    h2: 24,
    h3: 20,
    h4: 18,
    body1: 30,
    body2: 20,
    body3: 16,
    body4: 14,

    // App dimensions
    width: '100%',
    height: '100%'
};

export const SHADOWS = {
    light: {
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    medium: {
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,
        elevation: 7,
    },
    dark: {
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.41,
        shadowRadius: 9.11,
        elevation: 14,
    },
};

const appTheme = { COLORS, SIZES, SHADOWS };

export default appTheme;
