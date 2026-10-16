// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   LayoutAnimation,
//   Platform,
//   UIManager,
// } from 'react-native';

// // Required to enable LayoutAnimation on Android.
// if (
//   Platform.OS === 'android' &&
//   UIManager.setLayoutAnimationEnabledExperimental
// ) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// interface Student {
//   id: number;
//   name: string;
//   username: string;
//   email: string;
//   phone: string;
//   website: string;
//   address: {
//     street: string;
//     suite: string;
//     city: string;
//     zipcode: string;
//     geo: { lat: string; lng: string };
//   };
//   company: {
//     name: string;
//     catchPhrase: string;
//     bs: string;
//   };
// }

// const AVATAR_COLORS = [
//   '#6C5CE7',
//   '#00B894',
//   '#0984E3',
//   '#E17055',
//   '#FD79A8',
//   '#00CEC9',
// ];

// const getInitials = (name: string) =>
//   name
//     .split(' ')
//     .filter(Boolean)
//     .slice(0, 2)
//     .map(word => word[0].toUpperCase())
//     .join('');

// const InfoRow = ({ label, value }: { label: string; value: string }) => (
//   <View style={styles.infoRow}>
//     <Text style={styles.infoLabel}>{label}</Text>
//     <Text style={styles.infoValue}>{value}</Text>
//   </View>
// );

// const StudentCard = ({ item }: { item: Student }) => {
//   const [expanded, setExpanded] = useState(false);
//   const avatarColor = AVATAR_COLORS[item.id % AVATAR_COLORS.length];
//   const { address, company } = item;

//   const toggleExpand = () => {
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setExpanded(prev => !prev);
//   };

//   return (
//     <View style={styles.card}>
//       {/* Keep the header visible and toggle the details when tapped. */}
//       <TouchableOpacity
//         style={styles.header}
//         activeOpacity={0.7}
//         onPress={toggleExpand}
//       >
//         <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
//           <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
//         </View>
//         <View style={styles.headerText}>
//           <Text style={styles.name}>{item.name}</Text>
//           <Text style={styles.username}>@{item.username}</Text>
//         </View>
//         <Text
//           style={[
//             styles.chevron,
//             { transform: [{ rotate: expanded ? '180deg' : '0deg' }] },
//           ]}
//         >
//           ▼
//         </Text>
//       </TouchableOpacity>

//       {/* Expanded content */}
//       {expanded && (
//         <View style={styles.body}>
//           <View style={styles.divider} />

//           <Text style={styles.sectionTitle}>Contact</Text>
//           <InfoRow label="Email" value={item.email} />
//           <InfoRow label="Phone" value={item.phone} />
//           <InfoRow label="Website" value={item.website} />

//           <View style={styles.divider} />

//           <Text style={styles.sectionTitle}>Address</Text>
//           <InfoRow
//             label="Street"
//             value={`${address.street}, ${address.suite}`}
//           />
//           <InfoRow
//             label="City"
//             value={`${address.city} - ${address.zipcode}`}
//           />
//           <InfoRow
//             label="Geo"
//             value={`${address.geo.lat}, ${address.geo.lng}`}
//           />

//           <View style={styles.divider} />

//           <Text style={styles.sectionTitle}>Company</Text>
//           <InfoRow label="Name" value={company.name} />
//           <InfoRow label="Tagline" value={company.catchPhrase} />
//           <InfoRow label="Focus" value={company.bs} />
//         </View>
//       )}
//     </View>
//   );
// };

// const StudentListScreen = () => {
//   const [students, setStudents] = useState<Student[]>([]);

//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const data = await getStudents();
//       console.log('Student Data', data);

//       setStudents(data);
//     } catch (error) {
//       console.log('Failed to fetch students:', error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.totalText}>Total Students: {students.length}</Text>
//       <FlatList
//         data={students}
//         keyExtractor={item => item.id.toString()}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         renderItem={({ item }) => <StudentCard item={item} />}
//       />
//     </View>
//   );
// };

// export default StudentListScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F6FA',
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   totalText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2D3436',
//     marginBottom: 12,
//   },
//   listContent: {
//     paddingBottom: 24,
//   },
//   card: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   headerText: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   name: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: '#1E272E',
//   },
//   username: {
//     fontSize: 13,
//     color: '#636E72',
//     marginTop: 2,
//   },
//   chevron: {
//     fontSize: 14,
//     color: '#B2BEC3',
//     paddingHorizontal: 6,
//   },
//   body: {
//     marginTop: 4,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#ECEFF1',
//     marginVertical: 12,
//   },
//   sectionTitle: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#B2BEC3',
//     textTransform: 'uppercase',
//     letterSpacing: 0.8,
//     marginBottom: 8,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     marginBottom: 6,
//   },
//   infoLabel: {
//     width: 70,
//     fontSize: 13,
//     color: '#636E72',
//   },
//   infoValue: {
//     flex: 1,
//     fontSize: 13,
//     fontWeight: '500',
//     color: '#2D3436',
//   },
// });
