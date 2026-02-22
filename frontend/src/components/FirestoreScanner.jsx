import React, { useEffect, useState } from 'react';
import { db } from '../firebase';

const FirestoreScanner = () => {
    const [scanResults, setScanResults] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const scanFirestore = async () => {
            console.log("🔍 Starting Firestore Scan...");
            const results = {};
            const collectionsToScan = [
                // Root collections (educated guesses)
                'notices', 'manuals', 'systems', 'sops', 'checklists', 'calculators', 'posts', 'boards',
                // Site subcollections
                'sites/siteB/manuals', 'sites/siteB/checklists', 'sites/siteB/sops', 'sites/siteB/posts',
                'sites/siteB/safety_files', 'sites/siteB/risks'
            ];

            for (const path of collectionsToScan) {
                try {
                    console.log(`Checking collection: ${path}...`);
                    let ref;
                    if (path.includes('/')) {
                        const parts = path.split('/');
                        if (parts.length === 3) {
                            ref = db.collection(parts[0]).doc(parts[1]).collection(parts[2]);
                        }
                    } else {
                        ref = db.collection(path);
                    }

                    if (ref) {
                        const snapshot = await ref.limit(5).get();
                        if (!snapshot.empty) {
                            const params = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            results[path] = params;
                            console.log(`✅ Found data in [${path}]:`, params);
                        } else {
                            console.log(`❌ No data in [${path}]`);
                        }
                    }
                } catch (error) {
                    console.warn(`Error scanning [${path}]:`, error);
                }
            }

            // Also check root 'sites' doc for any other fields
            try {
                const siteDoc = await db.collection('sites').doc('siteB').get();
                if (siteDoc.exists) {
                    results['sites/siteB (Fields)'] = siteDoc.data();
                    console.log("✅ SiteB Fields:", siteDoc.data());
                }
            } catch (e) {
                console.error("Error reading siteB:", e);
            }

            setScanResults(results);
            setLoading(false);
            console.log("🏁 Firestore Scan Completed. Results:", results);
        };

        scanFirestore();
    }, []);

    if (!loading) return null; // Hide after loading

    return (
        <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-xl z-50 opacity-90 text-xs">
            <h3 className="font-bold mb-2">Firestore Scanner</h3>
            {loading ? <p>Scanning...</p> : (
                <div>
                    <p>Scan Complete. Check Console (F12).</p>
                    <ul className="mt-2 max-h-40 overflow-y-auto">
                        {Object.keys(scanResults).length === 0 ? <li>No extra data found.</li> :
                            Object.keys(scanResults).map(key => <li key={key}>FOUND: {key} ({Array.isArray(scanResults[key]) ? scanResults[key].length : 'Obj'} items)</li>)
                        }
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FirestoreScanner;
