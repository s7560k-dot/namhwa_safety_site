import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

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
    console.log("--- Site B (Suwon) Header Info Check ---");
    const siteBRef = doc(db, "sites", "siteB");
    const siteBSnap = await getDoc(siteBRef);
    if (siteBSnap.exists()) {
        console.log("Current Header:", JSON.stringify(siteBSnap.data().headerInfo, null, 2));
    }

    console.log("\n--- Site B (Suwon) Task Details Check ---");
    const detailsRef = collection(db, "sites", "siteB", "taskDetails");
    const detailsSnap = await getDocs(detailsRef);
    const tasks = [];
    detailsSnap.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
    });
    console.log(JSON.stringify(tasks, null, 2));

    console.log("\n--- Site B (Suwon) Activity Logs Check ---");
    const logsRef = collection(db, "sites", "siteB", "activityLogs");
    const logsSnap = await getDocs(logsRef);
    const logs = [];
    logsSnap.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
    });
    console.log("Logs count:", logs.length);
    if (logs.length > 0) {
        console.log("Sample Log Task Names:", [...new Set(logs.map(l => l.taskName))]);
    }
}

recoverSuwonData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
