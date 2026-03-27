import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';

const AuthContext = createContext({
    user: null,
    userData: null,
    loading: true,
    isAdmin: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser) {
                // Fetch additional user data from Firestore (including isApproved and role)
                const unsubscribeDoc = db.collection('users').doc(firebaseUser.uid)
                    .onSnapshot((doc) => {
                        if (doc.exists) {
                            setUserData(doc.data());
                        } else {
                            // If user document doesn't exist, create a basic one (default not approved)
                            const basicData = {
                                name: firebaseUser.displayName || 'Unnamed',
                                email: firebaseUser.email,
                                role: 'user',
                                isApproved: false,
                                createdAt: new Date().toISOString()
                            };
                            db.collection('users').doc(firebaseUser.uid).set(basicData);
                            setUserData(basicData);
                        }
                        setLoading(false);
                    }, (error) => {
                        console.error("Error fetching user doc:", error);
                        setLoading(false);
                    });
                
                return () => unsubscribeDoc();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const value = {
        user,
        userData,
        loading,
        isAdmin: userData?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
