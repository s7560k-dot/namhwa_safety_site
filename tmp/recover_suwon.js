const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, getDoc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyDbVG3iL3FBJe6alPLZnhFW_QAGpzeqFoY",
    authDomain: "namhwa-safety-dashboard.firebaseapp.com",
    projectId: "namhwa-safety-dashboard",
    storageBucket: "namhwa-safety-dashboard.firebasestorage.app",
    messagingSenderId: "152864778612",
    appId: "1:152864778612:web:ecc482adce93a1534a2421"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function recoverSuwonData() {
    try {
        console.log("--- Site B (Suwon) Task Details Check ---");
        const detailsRef = collection(db, "sites", "siteB", "taskDetails");
        const detailsSnap = await getDocs(detailsRef);
        const tasks = [];
        detailsSnap.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        console.log("Found tasks from details:", tasks.length);
        
        console.log("\n--- Site B (Suwon) Activity Logs Check ---");
        const logsRef = collection(db, "sites", "siteB", "activityLogs");
        const logsSnap = await getDocs(logsRef);
        const logs = [];
        logsSnap.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        
        if (logs.length > 0) {
            const uniqueTasks = [...new Set(logs.map(l => l.taskName))];
            console.log("Original Task Names from Logs:", JSON.stringify(uniqueTasks, null, 2));
            
            // Try to find more details from the first occurrence of each task
            const taskDetailsMap = {};
            uniqueTasks.forEach(name => {
                const firstLog = logs.find(l => l.taskName === name);
                taskDetailsMap[name] = firstLog;
            });
            console.log("Reconstructed Task Mapping Sample:", JSON.stringify(taskDetailsMap, null, 2));
        } else {
            console.log("No logs found in Site B.");
        }
    } catch (e) {
        console.error(e);
    }
}

recoverSuwonData().then(() => process.exit(0));
