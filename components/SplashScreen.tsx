import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
    onAnimationComplete: () => void;
    ready?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete, ready }) => {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // We want the splash to be immediate, so no entry animation needed.
        // If you want a subtle pulse or something, it could go here.
    }, []);

    useEffect(() => {
        if (ready) {
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => onAnimationComplete());
            }, 500); // Small buffer for visual smoothness

            return () => clearTimeout(timer);
        }
    }, [ready, fadeAnim, onAnimationComplete]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../assets/images/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Animated.Text style={styles.text}>RevCall</Animated.Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        zIndex: 999, // Ensure it's on top of everything
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
        marginBottom: 20,
        borderRadius: (width * 0.4) / 2,
        overflow: 'hidden',
    },
    text: {
        color: '#0ea5e9',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 10,
    },
});

export default SplashScreen;
