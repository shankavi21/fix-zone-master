/**
 * Firebase Data Seeder Script
 * Run this to populate your Firestore database with sample data
 * 
 * Usage: node seedData.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB06kWuBogbkYYi20KbMZDV20PbmQ2u6u8",
    authDomain: "fixzone-927de.firebaseapp.com",
    projectId: "fixzone-927de",
    storageBucket: "fixzone-927de.firebasestorage.app",
    messagingSenderId: "287593835554",
    appId: "1:287593835554:web:beacc5a864a9c812b6ae7b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample Data
const sampleTickets = [
    {
        applianceType: "Refrigerator",
        brand: "Samsung",
        model: "RT28M3022S8",
        status: "Pending",
        customerName: "John Silva",
        customerEmail: "john@example.com",
        customerPhone: "+94712345678",
        city: "Colombo",
        district: "Colombo",
        address: "123 Galle Road, Colombo 03",
        description: "Refrigerator not cooling properly. Making unusual noise.",
        scheduledDate: "2026-01-28",
        timeSlot: "morning",
        createdAt: Timestamp.now(),
        totalCost: 2500,
        visitCharge: 500,
        serviceCharge: 2000
    },
    {
        applianceType: "Washing Machine",
        brand: "LG",
        model: "FV1207S4W",
        status: "Assigned",
        customerName: "Sarah Fernando",
        customerEmail: "sarah@example.com",
        customerPhone: "+94723456789",
        city: "Kandy",
        district: "Kandy",
        address: "45 Peradeniya Road, Kandy",
        description: "Water not draining properly",
        scheduledDate: "2026-01-29",
        timeSlot: "afternoon",
        createdAt: Timestamp.now(),
        totalCost: 3000,
        visitCharge: 500,
        serviceCharge: 2500,
        technicianId: "tech_001",
        technicianName: "Kasun Perera"
    },
    {
        applianceType: "Air Conditioner",
        brand: "Daikin",
        model: "FTXM35R",
        status: "In Progress",
        customerName: "Michael De Silva",
        customerEmail: "michael@example.com",
        customerPhone: "+94734567890",
        city: "Galle",
        district: "Galle",
        address: "78 Main Street, Galle Fort",
        description: "AC not cooling, strange smell",
        scheduledDate: "2026-01-27",
        timeSlot: "evening",
        createdAt: Timestamp.now(),
        totalCost: 4500,
        visitCharge: 500,
        serviceCharge: 4000,
        technicianId: "tech_002",
        technicianName: "Nuwan Rajapaksa"
    },
    {
        applianceType: "Television",
        brand: "Sony",
        model: "KD-55X80J",
        status: "Completed",
        customerName: "Priya Jayawardena",
        customerEmail: "priya@example.com",
        customerPhone: "+94745678901",
        city: "Negombo",
        district: "Gampaha",
        address: "12 Beach Road, Negombo",
        description: "No display, power LED blinking",
        scheduledDate: "2026-01-25",
        timeSlot: "morning",
        createdAt: Timestamp.now(),
        totalCost: 3500,
        visitCharge: 500,
        serviceCharge: 3000,
        technicianId: "tech_003",
        technicianName: "Amal Wickramasinghe",
        completedAt: Timestamp.now()
    },
    {
        applianceType: "Microwave",
        brand: "Panasonic",
        model: "NN-ST34HM",
        status: "Quoted",
        customerName: "Dinesh Rodrigo",
        customerEmail: "dinesh@example.com",
        customerPhone: "+94756789012",
        city: "Kurunegala",
        district: "Kurunegala",
        address: "56 Hospital Road, Kurunegala",
        description: "Not heating food",
        scheduledDate: "2026-01-30",
        timeSlot: "afternoon",
        createdAt: Timestamp.now(),
        quotedAmount: 2800,
        visitCharge: 500,
        technicianId: "tech_001",
        technicianName: "Kasun Perera"
    },
    {
        applianceType: "Refrigerator",
        brand: "Abans",
        model: "ABR-350L",
        status: "Scheduled",
        customerName: "Nimal Gunawardena",
        customerEmail: "nimal@example.com",
        customerPhone: "+94767890123",
        city: "Jaffna",
        district: "Jaffna",
        address: "89 Hospital Road, Jaffna",
        description: "Freezer not working",
        scheduledDate: "2026-02-01",
        timeSlot: "morning",
        createdAt: Timestamp.now(),
        totalCost: 3200,
        visitCharge: 500,
        serviceCharge: 2700
    }
];

const sampleTechnicians = [
    {
        id: "tech_001",
        name: "Kasun Perera",
        email: "kasun@fixzone.lk",
        phone: "+94771234567",
        role: "technician",
        experience: "5 years",
        rating: 4.8,
        completedJobs: 245,
        specializations: ["Refrigerator", "Washing Machine", "Microwave"],
        districts: ["Colombo", "Gampaha", "Kalutara"],
        createdAt: Timestamp.now(),
        isAvailable: true
    },
    {
        id: "tech_002",
        name: "Nuwan Rajapaksa",
        email: "nuwan@fixzone.lk",
        phone: "+94772345678",
        role: "technician",
        experience: "7 years",
        rating: 4.9,
        completedJobs: 312,
        specializations: ["Air Conditioner", "Television", "Refrigerator"],
        districts: ["Kandy", "Matale", "Galle"],
        createdAt: Timestamp.now(),
        isAvailable: true
    },
    {
        id: "tech_003",
        name: "Amal Wickramasinghe",
        email: "amal@fixzone.lk",
        phone: "+94773456789",
        role: "technician",
        experience: "4 years",
        rating: 4.7,
        completedJobs: 198,
        specializations: ["Television", "Audio System", "Home Theater"],
        districts: ["Gampaha", "Colombo"],
        createdAt: Timestamp.now(),
        isAvailable: true
    }
];

const sampleApplications = [
    {
        fullName: "Chamara Bandara",
        email: "chamara.b@gmail.com",
        contactNumber: "+94784567890",
        nicNumber: "912345678V",
        experienceYears: 6,
        serviceCategories: ["Refrigerator", "Washing Machine", "Dishwasher"],
        operatingDistricts: ["Colombo", "Gampaha"],
        professionalSummary: "Experienced appliance technician with expertise in major home appliances. Certified by Samsung and LG.",
        status: "pending",
        createdAt: Timestamp.now()
    },
    {
        fullName: "Ruwan Dissanayake",
        email: "ruwan.d@gmail.com",
        contactNumber: "+94795678901",
        nicNumber: "881234567V",
        experienceYears: 8,
        serviceCategories: ["Air Conditioner", "Refrigerator"],
        operatingDistricts: ["Kandy", "Matale", "Nuwara Eliya"],
        professionalSummary: "AC specialist with 8 years experience. Certified by Daikin and Mitsubishi.",
        status: "pending",
        createdAt: Timestamp.now()
    }
];

const sampleNotifications = [
    {
        userId: "REPLACE_WITH_YOUR_USER_ID",
        title: "Ticket Created Successfully",
        message: "Your repair request #12345 has been created and assigned to a technician.",
        type: "success",
        isRead: false,
        createdAt: Timestamp.now()
    },
    {
        userId: "REPLACE_WITH_YOUR_USER_ID",
        title: "Technician On The Way",
        message: "Kasun Perera is on the way to your location. ETA: 20 minutes",
        type: "info",
        isRead: false,
        createdAt: Timestamp.now()
    },
    {
        userId: "REPLACE_WITH_YOUR_USER_ID",
        title: "Service Completed",
        message: "Your repair has been completed successfully. Please rate your experience.",
        type: "success",
        isRead: true,
        createdAt: Timestamp.now()
    }
];

// Seed function
async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // Seed Tickets
        console.log('📋 Seeding tickets...');
        for (const ticket of sampleTickets) {
            const docRef = await addDoc(collection(db, 'tickets'), ticket);
            console.log(`  ✅ Added ticket: ${ticket.customerName} - ${ticket.applianceType} (${docRef.id})`);
        }

        // Seed Technicians as Users
        console.log('\n👨‍🔧 Seeding technicians...');
        for (const tech of sampleTechnicians) {
            await setDoc(doc(db, 'users', tech.id), tech);
            console.log(`  ✅ Added technician: ${tech.name}`);
        }

        // Seed Applications
        console.log('\n📝 Seeding technician applications...');
        for (const app of sampleApplications) {
            const docRef = await addDoc(collection(db, 'technician_applications'), app);
            console.log(`  ✅ Added application: ${app.fullName} (${docRef.id})`);
        }

        // Note about notifications
        console.log('\n📬 Notifications:');
        console.log('  ⚠️  To add notifications, replace "REPLACE_WITH_YOUR_USER_ID" with your actual user ID');
        console.log('  💡 You can find your user ID in Firebase Console > Firestore > users\n');

        console.log('✅ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`  - Tickets: ${sampleTickets.length}`);
        console.log(`  - Technicians: ${sampleTechnicians.length}`);
        console.log(`  - Applications: ${sampleApplications.length}`);
        console.log('\n🎉 Your app is now connected with real data!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }

    process.exit(0);
}

// Run seeder
seedDatabase();
