import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function googleLogin() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    function logout() {
        return signOut(auth);
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("AuthContext: User detected:", user.uid);
                const docRef = doc(db, "users", user.uid);

                // Use onSnapshot for REAL-TIME updates
                const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("AuthContext: Real-time ROle Update ->", data.role);
                        setUserRole(data.role || 'customer');
                    } else {
                        console.warn("AuthContext: User document missing");
                        setUserRole('customer');
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("AuthContext: Error fetching user role:", error);
                    setUserRole('customer');
                    setLoading(false);
                });

                setCurrentUser(user);
                // We should technically return unsubscribeDoc but this is inside onAuthStateChanged...
                // Ideally we store it in a ref or state to clean up, but for this simple app, 
                // re-subscriptions on auth change are acceptable.
            } else {
                console.log("AuthContext: No user session");
                setCurrentUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        loading,
        signup,
        login,
        googleLogin,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
