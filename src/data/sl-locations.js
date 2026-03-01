export const SRI_LANKA_TOWNS = [
    { name: "Colombo", district: "Colombo", lat: 6.9271, lng: 79.8612 },
    { name: "Dehiwala-Mount Lavinia", district: "Colombo", lat: 6.8301, lng: 79.8801 },
    { name: "Moratuwa", district: "Colombo", lat: 6.7730, lng: 79.8816 },
    { name: "Negombo", district: "Gampaha", lat: 7.2081, lng: 79.8358 },
    { name: "Kotte", district: "Colombo", lat: 6.9016, lng: 79.9083 },
    { name: "Kandy", district: "Kandy", lat: 7.2906, lng: 80.6337 },
    { name: "Vavuniya", district: "Vavuniya", lat: 8.7542, lng: 80.4982 },
    { name: "Galle", district: "Galle", lat: 6.0535, lng: 80.2210 },
    { name: "Trincomalee", district: "Trincomalee", lat: 8.5711, lng: 81.2335 },
    { name: "Batticaloa", district: "Batticaloa", lat: 7.7310, lng: 81.6747 },
    { name: "Jaffna", district: "Jaffna", lat: 9.6615, lng: 80.0255 },
    { name: "Katunayake", district: "Gampaha", lat: 7.1664, lng: 79.8816 },
    { name: "Dambulla", district: "Matale", lat: 7.8600, lng: 80.6517 },
    { name: "Kolonnawa", district: "Colombo", lat: 6.9318, lng: 79.8863 },
    { name: "Anuradhapura", district: "Anuradhapura", lat: 8.3114, lng: 80.4037 },
    { name: "Ratnapura", district: "Ratnapura", lat: 6.7056, lng: 80.3847 },
    { name: "Badulla", district: "Badulla", lat: 6.9934, lng: 81.0550 },
    { name: "Matara", district: "Matara", lat: 5.9549, lng: 80.5550 },
    { name: "Puttalam", district: "Puttalam", lat: 8.0330, lng: 79.8260 },
    { name: "Matale", district: "Matale", lat: 7.4675, lng: 80.6234 },
    { name: "Kalutara", district: "Kalutara", lat: 6.5854, lng: 79.9607 },
    { name: "Mannar", district: "Mannar", lat: 8.9810, lng: 79.9044 },
    { name: "Panadura", district: "Kalutara", lat: 6.7107, lng: 79.9074 },
    { name: "Beruwala", district: "Kalutara", lat: 6.4788, lng: 79.9880 },
    { name: "Ja-Ela", district: "Gampaha", lat: 7.0784, lng: 79.8913 },
    { name: "Wattala", district: "Gampaha", lat: 6.9856, lng: 79.8913 },
    { name: "Gampaha", district: "Gampaha", lat: 7.0840, lng: 80.0098 },
    { name: "Nuwara Eliya", district: "Nuwara Eliya", lat: 6.9497, lng: 80.7891 },
    { name: "Ampara", district: "Ampara", lat: 7.2842, lng: 81.6747 },
    { name: "Kegalle", district: "Kegalle", lat: 7.2513, lng: 80.3464 },
    { name: "Hambantota", district: "Hambantota", lat: 6.1245, lng: 81.1185 },
    { name: "Moneragala", district: "Moneragala", lat: 6.8724, lng: 81.3507 },
    { name: "Kurunegala", district: "Kurunegala", lat: 7.4818, lng: 80.3609 },
    { name: "Kilinochchi", district: "Kilinochchi", lat: 9.3803, lng: 80.4037 },
    { name: "Mullaitivu", district: "Mullaitivu", lat: 9.2671, lng: 80.8144 },
    { name: "Bambalapitiya", district: "Colombo", lat: 6.8974, lng: 79.8550 },
    { name: "Kollupitiya", district: "Colombo", lat: 6.9123, lng: 79.8491 },
    { name: "Rajagiriya", district: "Colombo", lat: 6.9097, lng: 79.9074 },
    { name: "Nugegoda", district: "Colombo", lat: 6.8747, lng: 79.8893 },
    { name: "Battaramulla", district: "Colombo", lat: 6.8989, lng: 79.9223 },
    { name: "Wellawatte", district: "Colombo", lat: 6.8778, lng: 79.8604 },
    { name: "Maharagama", district: "Colombo", lat: 6.8511, lng: 79.9212 },
    { name: "Mount Lavinia", district: "Colombo", lat: 6.8373, lng: 79.8679 },
    { name: "Malabe", district: "Colombo", lat: 6.9039, lng: 79.9547 },
    { name: "Kaduwela", district: "Colombo", lat: 6.9360, lng: 79.9840 },
    { name: "Homagama", district: "Colombo", lat: 6.8415, lng: 80.0034 },
    { name: "Kelaniya", district: "Gampaha", lat: 6.9535, lng: 79.9145 }
];

// Helper to find nearest town
export const findNearestTown = (lat, lng) => {
    let nearest = null;
    let minDistance = Infinity;

    SRI_LANKA_TOWNS.forEach(town => {
        // Simple Pythagorean for estimation, good enough for town detection
        const d = Math.sqrt(Math.pow(town.lat - lat, 2) + Math.pow(town.lng - lng, 2));
        if (d < minDistance) {
            minDistance = d;
            nearest = town;
        }
    });

    return nearest;
};

// Local Search
export const searchTowns = (query) => {
    if (!query) return [];
    const q = query.toLowerCase();
    return SRI_LANKA_TOWNS.filter(t =>
        t.name.toLowerCase().includes(q) || t.district.toLowerCase().includes(q)
    ).slice(0, 5);
};
