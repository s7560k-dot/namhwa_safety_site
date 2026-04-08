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
    const [mockUser, setMockUser] = useState(null); // [추가] 프리뷰/미리보기용 가상 유저

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
            setUser(firebaseUser);
            
            if (firebaseUser) {
                // Fetch additional user data from Firestore (including isApproved and role)
                const unsubscribeDoc = db.collection('users').doc(firebaseUser.uid)
                    .onSnapshot((doc) => {
                        const isEmailHardcoded = ['s7560k@gmail.com', 'leejaehoon5712@gmail.com'].includes(firebaseUser.email);
                        const isPrimaryAdmin = firebaseUser.email === 's7560k@gmail.com';

                        if (doc.exists) {
                            const data = doc.data();
                            
                            // [추가] 부트스트랩 승인 처리: 특정 이메일은 강제로 승인/권한 부여
                            if (isEmailHardcoded && (data.role !== (isPrimaryAdmin ? 'admin' : data.role) || !data.isApproved)) {
                                const updatedData = { 
                                    ...data, 
                                    role: isPrimaryAdmin ? 'admin' : (data.role || 'user'), 
                                    isApproved: true 
                                };
                                db.collection('users').doc(firebaseUser.uid).update({ 
                                    role: updatedData.role, 
                                    isApproved: true 
                                });
                                setUserData(updatedData);
                            } else {
                                setUserData(data);
                            }
                        } else {
                            // If user document doesn't exist, create a basic one
                            // [추가] 부트스트랩 승인 설정: 특정 이메일은 가입 시 자동 승인
                            const basicData = {
                                name: firebaseUser.displayName || 'Unnamed',
                                email: firebaseUser.email,
                                role: isPrimaryAdmin ? 'admin' : 'user',
                                isApproved: isEmailHardcoded ? true : false,
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
        user: mockUser ? { email: mockUser.email, uid: 'mock-uid', displayName: mockUser.name } : user,
        userData: mockUser || userData,
        loading,
        isAdmin: (mockUser || userData)?.role === 'admin',
        isInterviewer: (mockUser || userData)?.role === 'interviewer',
        setMockUser,
        isMock: !!mockUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
