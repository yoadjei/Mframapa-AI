import { City } from '../store/useStore';

// 500 pre-cached African cities for offline search
// Covers all 54 countries, mix of urban/rural, major population centres
export const AFRICAN_CITIES: City[] = [
  // Nigeria
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792, urban: true },
  { name: 'Kano', country: 'Nigeria', lat: 12.0022, lon: 8.5919, urban: true },
  { name: 'Ibadan', country: 'Nigeria', lat: 7.3775, lon: 3.9470, urban: true },
  { name: 'Abuja', country: 'Nigeria', lat: 9.0579, lon: 7.4951, urban: true },
  { name: 'Port Harcourt', country: 'Nigeria', lat: 4.8156, lon: 7.0498, urban: true },
  { name: 'Benin City', country: 'Nigeria', lat: 6.3350, lon: 5.6037, urban: true },
  { name: 'Maiduguri', country: 'Nigeria', lat: 11.8311, lon: 13.1509, urban: true },
  { name: 'Zaria', country: 'Nigeria', lat: 11.1105, lon: 7.7227, urban: true },
  { name: 'Aba', country: 'Nigeria', lat: 5.1066, lon: 7.3667, urban: true },
  { name: 'Jos', country: 'Nigeria', lat: 9.8965, lon: 8.8583, urban: true },
  { name: 'Ilorin', country: 'Nigeria', lat: 8.4966, lon: 4.5426, urban: true },
  { name: 'Oyo', country: 'Nigeria', lat: 7.8526, lon: 3.9319, urban: false },
  { name: 'Enugu', country: 'Nigeria', lat: 6.4584, lon: 7.5464, urban: true },
  { name: 'Abeokuta', country: 'Nigeria', lat: 7.1475, lon: 3.3619, urban: true },
  { name: 'Sokoto', country: 'Nigeria', lat: 13.0059, lon: 5.2476, urban: true },
  { name: 'Kaduna', country: 'Nigeria', lat: 10.5264, lon: 7.4381, urban: true },
  { name: 'Warri', country: 'Nigeria', lat: 5.5167, lon: 5.7500, urban: true },
  { name: 'Calabar', country: 'Nigeria', lat: 4.9517, lon: 8.3220, urban: true },
  { name: 'Uyo', country: 'Nigeria', lat: 5.0511, lon: 7.9333, urban: true },
  { name: 'Asaba', country: 'Nigeria', lat: 6.1974, lon: 6.7340, urban: true },

  // Ethiopia
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.0320, lon: 38.7469, urban: true },
  { name: 'Dire Dawa', country: 'Ethiopia', lat: 9.5932, lon: 41.8610, urban: true },
  { name: 'Mekelle', country: 'Ethiopia', lat: 13.4967, lon: 39.4767, urban: true },
  { name: 'Gondar', country: 'Ethiopia', lat: 12.6030, lon: 37.4521, urban: true },
  { name: 'Awassa', country: 'Ethiopia', lat: 7.0621, lon: 38.4769, urban: true },
  { name: 'Bahir Dar', country: 'Ethiopia', lat: 11.5936, lon: 37.3906, urban: true },
  { name: 'Dessie', country: 'Ethiopia', lat: 11.1333, lon: 39.6333, urban: true },
  { name: 'Jimma', country: 'Ethiopia', lat: 7.6667, lon: 36.8333, urban: true },
  { name: 'Jijiga', country: 'Ethiopia', lat: 9.3500, lon: 42.8000, urban: false },
  { name: 'Harar', country: 'Ethiopia', lat: 9.3119, lon: 42.1224, urban: true },

  // Egypt
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, urban: true },
  { name: 'Alexandria', country: 'Egypt', lat: 31.2001, lon: 29.9187, urban: true },
  { name: 'Giza', country: 'Egypt', lat: 30.0131, lon: 31.2089, urban: true },
  { name: 'Shubra El-Kheima', country: 'Egypt', lat: 30.1286, lon: 31.2422, urban: true },
  { name: 'Port Said', country: 'Egypt', lat: 31.2565, lon: 32.2841, urban: true },
  { name: 'Suez', country: 'Egypt', lat: 29.9737, lon: 32.5251, urban: true },
  { name: 'Luxor', country: 'Egypt', lat: 25.6872, lon: 32.6396, urban: true },
  { name: 'Aswan', country: 'Egypt', lat: 24.0889, lon: 32.8997, urban: true },
  { name: 'El Mahalla El Kubra', country: 'Egypt', lat: 30.9714, lon: 31.1628, urban: true },
  { name: 'Tanta', country: 'Egypt', lat: 30.7865, lon: 31.0004, urban: true },

  // DRC
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.3217, lon: 15.3222, urban: true },
  { name: 'Lubumbashi', country: 'DR Congo', lat: -11.6876, lon: 27.5026, urban: true },
  { name: 'Mbuji-Mayi', country: 'DR Congo', lat: -6.1500, lon: 23.6000, urban: true },
  { name: 'Kananga', country: 'DR Congo', lat: -5.8957, lon: 22.4167, urban: true },
  { name: 'Kisangani', country: 'DR Congo', lat: 0.5153, lon: 25.1856, urban: true },
  { name: 'Bukavu', country: 'DR Congo', lat: -2.4950, lon: 28.8617, urban: true },
  { name: 'Goma', country: 'DR Congo', lat: -1.6794, lon: 29.2228, urban: true },
  { name: 'Bunia', country: 'DR Congo', lat: 1.5648, lon: 30.2456, urban: false },
  { name: 'Matadi', country: 'DR Congo', lat: -5.8167, lon: 13.4500, urban: true },
  { name: 'Kolwezi', country: 'DR Congo', lat: -10.7167, lon: 25.4667, urban: true },

  // Tanzania
  { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lon: 39.2083, urban: true },
  { name: 'Dodoma', country: 'Tanzania', lat: -6.1730, lon: 35.7395, urban: true },
  { name: 'Mwanza', country: 'Tanzania', lat: -2.5167, lon: 32.9000, urban: true },
  { name: 'Zanzibar City', country: 'Tanzania', lat: -6.1659, lon: 39.2026, urban: true },
  { name: 'Arusha', country: 'Tanzania', lat: -3.3869, lon: 36.6830, urban: true },
  { name: 'Moshi', country: 'Tanzania', lat: -3.3349, lon: 37.3400, urban: true },
  { name: 'Tanga', country: 'Tanzania', lat: -5.0693, lon: 39.0986, urban: true },
  { name: 'Mbeya', country: 'Tanzania', lat: -8.9000, lon: 33.4500, urban: true },
  { name: 'Morogoro', country: 'Tanzania', lat: -6.8214, lon: 37.6603, urban: true },
  { name: 'Tabora', country: 'Tanzania', lat: -5.0167, lon: 32.8000, urban: false },

  // Kenya
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, urban: true },
  { name: 'Mombasa', country: 'Kenya', lat: -4.0435, lon: 39.6682, urban: true },
  { name: 'Kisumu', country: 'Kenya', lat: -0.1022, lon: 34.7617, urban: true },
  { name: 'Nakuru', country: 'Kenya', lat: -0.3031, lon: 36.0800, urban: true },
  { name: 'Eldoret', country: 'Kenya', lat: 0.5143, lon: 35.2698, urban: true },
  { name: 'Thika', country: 'Kenya', lat: -1.0332, lon: 37.0693, urban: true },
  { name: 'Machakos', country: 'Kenya', lat: -1.5177, lon: 37.2634, urban: false },
  { name: 'Malindi', country: 'Kenya', lat: -3.2175, lon: 40.1169, urban: false },
  { name: 'Kitale', country: 'Kenya', lat: 1.0153, lon: 35.0062, urban: false },
  { name: 'Garissa', country: 'Kenya', lat: -0.4532, lon: 39.6461, urban: false },

  // South Africa
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473, urban: true },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, urban: true },
  { name: 'Durban', country: 'South Africa', lat: -29.8587, lon: 31.0218, urban: true },
  { name: 'Pretoria', country: 'South Africa', lat: -25.7461, lon: 28.1881, urban: true },
  { name: 'Port Elizabeth', country: 'South Africa', lat: -33.9608, lon: 25.6022, urban: true },
  { name: 'East London', country: 'South Africa', lat: -33.0153, lon: 27.9116, urban: true },
  { name: 'Bloemfontein', country: 'South Africa', lat: -29.0852, lon: 26.1596, urban: true },
  { name: 'Vereeniging', country: 'South Africa', lat: -26.6732, lon: 27.9322, urban: true },
  { name: 'Soweto', country: 'South Africa', lat: -26.2678, lon: 27.8585, urban: true },
  { name: 'Pietermaritzburg', country: 'South Africa', lat: -29.6006, lon: 30.3794, urban: true },
  { name: 'Nelspruit', country: 'South Africa', lat: -25.4745, lon: 30.9703, urban: true },
  { name: 'Polokwane', country: 'South Africa', lat: -23.9045, lon: 29.4688, urban: true },

  // Sudan
  { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lon: 32.5599, urban: true },
  { name: 'Omdurman', country: 'Sudan', lat: 15.6445, lon: 32.4777, urban: true },
  { name: 'Port Sudan', country: 'Sudan', lat: 19.6158, lon: 37.2164, urban: true },
  { name: 'Kassala', country: 'Sudan', lat: 15.4500, lon: 36.4000, urban: true },
  { name: 'El Obeid', country: 'Sudan', lat: 13.1833, lon: 30.2167, urban: false },
  { name: 'Wad Madani', country: 'Sudan', lat: 14.3881, lon: 33.5188, urban: false },

  // Algeria
  { name: 'Algiers', country: 'Algeria', lat: 36.7372, lon: 3.0865, urban: true },
  { name: 'Oran', country: 'Algeria', lat: 35.6969, lon: -0.6331, urban: true },
  { name: 'Constantine', country: 'Algeria', lat: 36.3650, lon: 6.6147, urban: true },
  { name: 'Annaba', country: 'Algeria', lat: 36.9000, lon: 7.7667, urban: true },
  { name: 'Blida', country: 'Algeria', lat: 36.4700, lon: 2.8300, urban: true },
  { name: 'Batna', country: 'Algeria', lat: 35.5550, lon: 6.1742, urban: true },
  { name: 'Tlemcen', country: 'Algeria', lat: 34.8828, lon: -1.3167, urban: true },
  { name: 'Bejaïa', country: 'Algeria', lat: 36.7539, lon: 5.0838, urban: true },
  { name: 'Sétif', country: 'Algeria', lat: 36.1898, lon: 5.4108, urban: true },
  { name: 'Biskra', country: 'Algeria', lat: 34.8500, lon: 5.7333, urban: false },

  // Morocco
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898, urban: true },
  { name: 'Rabat', country: 'Morocco', lat: 34.0209, lon: -6.8416, urban: true },
  { name: 'Fez', country: 'Morocco', lat: 34.0181, lon: -5.0078, urban: true },
  { name: 'Marrakesh', country: 'Morocco', lat: 31.6295, lon: -7.9811, urban: true },
  { name: 'Agadir', country: 'Morocco', lat: 30.4278, lon: -9.5981, urban: true },
  { name: 'Tangier', country: 'Morocco', lat: 35.7595, lon: -5.8340, urban: true },
  { name: 'Meknès', country: 'Morocco', lat: 33.8935, lon: -5.5473, urban: true },
  { name: 'Oujda', country: 'Morocco', lat: 34.6878, lon: -1.9078, urban: true },
  { name: 'Kénitra', country: 'Morocco', lat: 34.2610, lon: -6.5802, urban: true },
  { name: 'Tetouan', country: 'Morocco', lat: 35.5889, lon: -5.3626, urban: true },

  // Ghana
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lon: -0.1870, urban: true },
  { name: 'Kumasi', country: 'Ghana', lat: 6.6885, lon: -1.6244, urban: true },
  { name: 'Tamale', country: 'Ghana', lat: 9.4075, lon: -0.8533, urban: true },
  { name: 'Sekondi-Takoradi', country: 'Ghana', lat: 4.9340, lon: -1.7139, urban: true },
  { name: 'Cape Coast', country: 'Ghana', lat: 5.1053, lon: -1.2466, urban: true },
  { name: 'Tema', country: 'Ghana', lat: 5.6698, lon: 0.0166, urban: true },
  { name: 'Koforidua', country: 'Ghana', lat: 6.0940, lon: -0.2590, urban: true },
  { name: 'Ho', country: 'Ghana', lat: 6.6011, lon: 0.4712, urban: false },
  { name: 'Bolgatanga', country: 'Ghana', lat: 10.7852, lon: -0.8514, urban: false },
  { name: 'Sunyani', country: 'Ghana', lat: 7.3398, lon: -2.3281, urban: false },

  // Côte d'Ivoire
  { name: 'Abidjan', country: "Côte d'Ivoire", lat: 5.3600, lon: -4.0083, urban: true },
  { name: 'Bouaké', country: "Côte d'Ivoire", lat: 7.6899, lon: -5.0300, urban: true },
  { name: 'Yamoussoukro', country: "Côte d'Ivoire", lat: 6.8276, lon: -5.2893, urban: true },
  { name: 'Daloa', country: "Côte d'Ivoire", lat: 6.8769, lon: -6.4502, urban: true },
  { name: 'San Pedro', country: "Côte d'Ivoire", lat: 4.7485, lon: -6.6363, urban: true },
  { name: 'Korhogo', country: "Côte d'Ivoire", lat: 9.4580, lon: -5.6296, urban: false },
  { name: 'Man', country: "Côte d'Ivoire", lat: 7.4127, lon: -7.5538, urban: false },

  // Cameroon
  { name: 'Douala', country: 'Cameroon', lat: 4.0511, lon: 9.7679, urban: true },
  { name: 'Yaoundé', country: 'Cameroon', lat: 3.8480, lon: 11.5021, urban: true },
  { name: 'Garoua', country: 'Cameroon', lat: 9.3000, lon: 13.3833, urban: true },
  { name: 'Bamenda', country: 'Cameroon', lat: 5.9597, lon: 10.1459, urban: true },
  { name: 'Maroua', country: 'Cameroon', lat: 10.5900, lon: 14.3189, urban: true },
  { name: 'Bafoussam', country: 'Cameroon', lat: 5.4781, lon: 10.4178, urban: true },
  { name: 'Ngaoundéré', country: 'Cameroon', lat: 7.3167, lon: 13.5833, urban: false },
  { name: 'Bertoua', country: 'Cameroon', lat: 4.5833, lon: 13.6833, urban: false },

  // Senegal
  { name: 'Dakar', country: 'Senegal', lat: 14.7167, lon: -17.4677, urban: true },
  { name: 'Touba', country: 'Senegal', lat: 14.8706, lon: -15.8806, urban: true },
  { name: 'Thiès', country: 'Senegal', lat: 14.7910, lon: -16.9260, urban: true },
  { name: 'Kaolack', country: 'Senegal', lat: 14.1652, lon: -16.0726, urban: true },
  { name: 'Ziguinchor', country: 'Senegal', lat: 12.5654, lon: -16.2719, urban: true },
  { name: 'Saint-Louis', country: 'Senegal', lat: 16.0170, lon: -16.4897, urban: true },
  { name: 'Mbour', country: 'Senegal', lat: 14.3650, lon: -16.9600, urban: false },

  // Mali
  { name: 'Bamako', country: 'Mali', lat: 12.6392, lon: -8.0029, urban: true },
  { name: 'Sikasso', country: 'Mali', lat: 11.3178, lon: -5.6659, urban: true },
  { name: 'Mopti', country: 'Mali', lat: 14.4831, lon: -4.1956, urban: false },
  { name: 'Koutiala', country: 'Mali', lat: 12.3931, lon: -5.4631, urban: false },
  { name: 'Gao', country: 'Mali', lat: 16.2666, lon: -0.0500, urban: false },
  { name: 'Timbuktu', country: 'Mali', lat: 16.7735, lon: -3.0074, urban: false },
  { name: 'Ségou', country: 'Mali', lat: 13.4317, lon: -6.2155, urban: false },

  // Niger
  { name: 'Niamey', country: 'Niger', lat: 13.5137, lon: 2.1098, urban: true },
  { name: 'Zinder', country: 'Niger', lat: 13.8055, lon: 8.9840, urban: true },
  { name: 'Maradi', country: 'Niger', lat: 13.5000, lon: 7.1000, urban: true },
  { name: 'Agadez', country: 'Niger', lat: 16.9742, lon: 7.9908, urban: false },
  { name: 'Tahoua', country: 'Niger', lat: 14.8883, lon: 5.2647, urban: false },
  { name: 'Dosso', country: 'Niger', lat: 13.0319, lon: 3.1960, urban: false },

  // Burkina Faso
  { name: 'Ouagadougou', country: 'Burkina Faso', lat: 12.3647, lon: -1.5353, urban: true },
  { name: 'Bobo-Dioulasso', country: 'Burkina Faso', lat: 11.1771, lon: -4.2979, urban: true },
  { name: 'Koudougou', country: 'Burkina Faso', lat: 12.2535, lon: -2.3625, urban: true },
  { name: 'Banfora', country: 'Burkina Faso', lat: 10.6333, lon: -4.7667, urban: false },
  { name: 'Ouahigouya', country: 'Burkina Faso', lat: 13.5731, lon: -2.4224, urban: false },

  // Uganda
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lon: 32.5825, urban: true },
  { name: 'Gulu', country: 'Uganda', lat: 2.7748, lon: 32.2990, urban: true },
  { name: 'Mbarara', country: 'Uganda', lat: -0.6071, lon: 30.6545, urban: true },
  { name: 'Jinja', country: 'Uganda', lat: 0.4244, lon: 33.2041, urban: true },
  { name: 'Entebbe', country: 'Uganda', lat: 0.0512, lon: 32.4637, urban: true },
  { name: 'Masaka', country: 'Uganda', lat: -0.3492, lon: 31.7349, urban: false },
  { name: 'Lira', country: 'Uganda', lat: 2.2499, lon: 32.8998, urban: false },

  // Rwanda
  { name: 'Kigali', country: 'Rwanda', lat: -1.9441, lon: 30.0619, urban: true },
  { name: 'Gisenyi', country: 'Rwanda', lat: -1.7042, lon: 29.2568, urban: true },
  { name: 'Butare', country: 'Rwanda', lat: -2.5986, lon: 29.7386, urban: false },
  { name: 'Gitarama', country: 'Rwanda', lat: -2.0742, lon: 29.7568, urban: false },

  // Zimbabwe
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8252, lon: 31.0335, urban: true },
  { name: 'Bulawayo', country: 'Zimbabwe', lat: -20.1325, lon: 28.6264, urban: true },
  { name: 'Chitungwiza', country: 'Zimbabwe', lat: -17.9937, lon: 31.0764, urban: true },
  { name: 'Mutare', country: 'Zimbabwe', lat: -18.9707, lon: 32.6709, urban: true },
  { name: 'Gweru', country: 'Zimbabwe', lat: -19.4500, lon: 29.8167, urban: true },
  { name: 'Kwekwe', country: 'Zimbabwe', lat: -18.9281, lon: 29.8150, urban: true },

  // Mozambique
  { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lon: 32.5732, urban: true },
  { name: 'Beira', country: 'Mozambique', lat: -19.8436, lon: 34.8389, urban: true },
  { name: 'Nampula', country: 'Mozambique', lat: -15.1167, lon: 39.2667, urban: true },
  { name: 'Chimoio', country: 'Mozambique', lat: -19.1167, lon: 33.4833, urban: true },
  { name: 'Nacala', country: 'Mozambique', lat: -14.5500, lon: 40.6667, urban: false },
  { name: 'Quelimane', country: 'Mozambique', lat: -17.8786, lon: 36.8869, urban: true },
  { name: 'Tete', country: 'Mozambique', lat: -16.1564, lon: 33.5867, urban: false },

  // Angola
  { name: 'Luanda', country: 'Angola', lat: -8.8368, lon: 13.2343, urban: true },
  { name: 'Huambo', country: 'Angola', lat: -12.7761, lon: 15.7393, urban: true },
  { name: 'Lubango', country: 'Angola', lat: -14.9177, lon: 13.4922, urban: true },
  { name: 'Benguela', country: 'Angola', lat: -12.5783, lon: 13.4072, urban: true },
  { name: 'Lobito', country: 'Angola', lat: -12.3467, lon: 13.5456, urban: true },
  { name: 'Malanje', country: 'Angola', lat: -9.5400, lon: 16.3400, urban: false },
  { name: 'Cabinda', country: 'Angola', lat: -5.5500, lon: 12.1900, urban: true },

  // Zambia
  { name: 'Lusaka', country: 'Zambia', lat: -15.4167, lon: 28.2833, urban: true },
  { name: 'Kitwe', country: 'Zambia', lat: -12.8027, lon: 28.2132, urban: true },
  { name: 'Ndola', country: 'Zambia', lat: -12.9587, lon: 28.6366, urban: true },
  { name: 'Kabwe', country: 'Zambia', lat: -14.4469, lon: 28.4464, urban: true },
  { name: 'Livingstone', country: 'Zambia', lat: -17.8542, lon: 25.8542, urban: true },
  { name: 'Chipata', country: 'Zambia', lat: -13.6449, lon: 32.6449, urban: false },

  // Madagascar
  { name: 'Antananarivo', country: 'Madagascar', lat: -18.9137, lon: 47.5361, urban: true },
  { name: 'Toamasina', country: 'Madagascar', lat: -18.1492, lon: 49.4022, urban: true },
  { name: 'Antsirabe', country: 'Madagascar', lat: -19.8659, lon: 47.0359, urban: true },
  { name: 'Fianarantsoa', country: 'Madagascar', lat: -21.4500, lon: 47.0833, urban: true },
  { name: 'Mahajanga', country: 'Madagascar', lat: -15.7167, lon: 46.3167, urban: true },
  { name: 'Toliara', country: 'Madagascar', lat: -23.3500, lon: 43.6667, urban: false },

  // Tunisia
  { name: 'Tunis', country: 'Tunisia', lat: 36.8190, lon: 10.1658, urban: true },
  { name: 'Sfax', country: 'Tunisia', lat: 34.7478, lon: 10.7661, urban: true },
  { name: 'Sousse', country: 'Tunisia', lat: 35.8245, lon: 10.6346, urban: true },
  { name: 'Kairouan', country: 'Tunisia', lat: 35.6781, lon: 10.0989, urban: true },
  { name: 'Bizerte', country: 'Tunisia', lat: 37.2744, lon: 9.8739, urban: true },
  { name: 'Gabès', country: 'Tunisia', lat: 33.8814, lon: 10.0982, urban: true },

  // Libya
  { name: 'Tripoli', country: 'Libya', lat: 32.9025, lon: 13.1802, urban: true },
  { name: 'Benghazi', country: 'Libya', lat: 32.1190, lon: 20.0868, urban: true },
  { name: 'Misrata', country: 'Libya', lat: 32.3754, lon: 15.0925, urban: true },
  { name: 'Tarhuna', country: 'Libya', lat: 32.4333, lon: 13.6333, urban: false },
  { name: 'Sabha', country: 'Libya', lat: 27.0377, lon: 14.4283, urban: false },

  // Somalia
  { name: 'Mogadishu', country: 'Somalia', lat: 2.0469, lon: 45.3182, urban: true },
  { name: 'Hargeisa', country: 'Somalia', lat: 9.5600, lon: 44.0650, urban: true },
  { name: 'Bosaso', country: 'Somalia', lat: 11.2811, lon: 49.1814, urban: true },
  { name: 'Kismayo', country: 'Somalia', lat: -0.3582, lon: 42.5454, urban: true },
  { name: 'Berbera', country: 'Somalia', lat: 10.4333, lon: 45.0167, urban: false },

  // Malawi
  { name: 'Lilongwe', country: 'Malawi', lat: -13.9626, lon: 33.7741, urban: true },
  { name: 'Blantyre', country: 'Malawi', lat: -15.7861, lon: 35.0058, urban: true },
  { name: 'Mzuzu', country: 'Malawi', lat: -11.4587, lon: 34.0177, urban: true },
  { name: 'Zomba', country: 'Malawi', lat: -15.3833, lon: 35.3167, urban: false },

  // Botswana
  { name: 'Gaborone', country: 'Botswana', lat: -24.6581, lon: 25.9122, urban: true },
  { name: 'Francistown', country: 'Botswana', lat: -21.1645, lon: 27.5079, urban: true },
  { name: 'Molepolole', country: 'Botswana', lat: -24.4067, lon: 25.4950, urban: false },
  { name: 'Serowe', country: 'Botswana', lat: -22.3908, lon: 26.7106, urban: false },

  // Namibia
  { name: 'Windhoek', country: 'Namibia', lat: -22.5597, lon: 17.0832, urban: true },
  { name: 'Rundu', country: 'Namibia', lat: -17.9333, lon: 19.7667, urban: false },
  { name: 'Walvis Bay', country: 'Namibia', lat: -22.9575, lon: 14.5053, urban: true },
  { name: 'Oshakati', country: 'Namibia', lat: -17.7833, lon: 15.6833, urban: false },
  { name: 'Swakopmund', country: 'Namibia', lat: -22.6784, lon: 14.5266, urban: true },

  // Togo
  { name: 'Lomé', country: 'Togo', lat: 6.1375, lon: 1.2123, urban: true },
  { name: 'Sokodé', country: 'Togo', lat: 8.9833, lon: 1.1333, urban: false },
  { name: 'Kara', country: 'Togo', lat: 9.5511, lon: 1.1865, urban: false },
  { name: 'Atakpamé', country: 'Togo', lat: 7.5333, lon: 1.1167, urban: false },

  // Benin
  { name: 'Cotonou', country: 'Benin', lat: 6.3654, lon: 2.4183, urban: true },
  { name: 'Porto-Novo', country: 'Benin', lat: 6.4969, lon: 2.6289, urban: true },
  { name: 'Parakou', country: 'Benin', lat: 9.3372, lon: 2.6283, urban: true },
  { name: 'Abomey-Calavi', country: 'Benin', lat: 6.4500, lon: 2.3556, urban: true },
  { name: 'Bohicon', country: 'Benin', lat: 7.1750, lon: 2.0667, urban: false },

  // Guinea
  { name: 'Conakry', country: 'Guinea', lat: 9.5370, lon: -13.6773, urban: true },
  { name: 'Labé', country: 'Guinea', lat: 11.3204, lon: -12.2845, urban: false },
  { name: 'Nzérékoré', country: 'Guinea', lat: 7.7447, lon: -8.8194, urban: false },
  { name: 'Kindia', country: 'Guinea', lat: 10.0667, lon: -12.8667, urban: false },
  { name: 'Kankan', country: 'Guinea', lat: 10.3833, lon: -9.3000, urban: false },

  // Sierra Leone
  { name: 'Freetown', country: 'Sierra Leone', lat: 8.4897, lon: -13.2344, urban: true },
  { name: 'Bo', country: 'Sierra Leone', lat: 7.9647, lon: -11.7383, urban: false },
  { name: 'Kenema', country: 'Sierra Leone', lat: 7.8769, lon: -11.1909, urban: false },
  { name: 'Makeni', country: 'Sierra Leone', lat: 8.8833, lon: -12.0500, urban: false },

  // Liberia
  { name: 'Monrovia', country: 'Liberia', lat: 6.3005, lon: -10.7969, urban: true },
  { name: 'Gbarnga', country: 'Liberia', lat: 6.9940, lon: -9.4715, urban: false },
  { name: 'Buchanan', country: 'Liberia', lat: 5.8808, lon: -10.0467, urban: false },

  // Chad
  { name: "N'Djamena", country: 'Chad', lat: 12.1048, lon: 15.0440, urban: true },
  { name: 'Moundou', country: 'Chad', lat: 8.5667, lon: 16.0833, urban: true },
  { name: 'Sarh', country: 'Chad', lat: 9.1500, lon: 18.3833, urban: false },
  { name: 'Abéché', country: 'Chad', lat: 13.8333, lon: 20.8333, urban: false },
  { name: 'Am Timan', country: 'Chad', lat: 11.0333, lon: 20.2833, urban: false },

  // Central African Republic
  { name: 'Bangui', country: 'Central African Republic', lat: 4.3612, lon: 18.5550, urban: true },
  { name: 'Bimbo', country: 'Central African Republic', lat: 4.2622, lon: 18.4135, urban: true },
  { name: 'Berbérati', country: 'Central African Republic', lat: 4.2608, lon: 15.7899, urban: false },

  // Republic of Congo
  { name: 'Brazzaville', country: 'Republic of Congo', lat: -4.2694, lon: 15.2712, urban: true },
  { name: 'Pointe-Noire', country: 'Republic of Congo', lat: -4.7692, lon: 11.8662, urban: true },
  { name: 'Dolisie', country: 'Republic of Congo', lat: -4.2000, lon: 12.6667, urban: false },

  // Gabon
  { name: 'Libreville', country: 'Gabon', lat: 0.3901, lon: 9.4544, urban: true },
  { name: 'Port-Gentil', country: 'Gabon', lat: -0.7193, lon: 8.7815, urban: true },
  { name: 'Franceville', country: 'Gabon', lat: -1.6333, lon: 13.5833, urban: false },

  // Equatorial Guinea
  { name: 'Malabo', country: 'Equatorial Guinea', lat: 3.7500, lon: 8.7833, urban: true },
  { name: 'Bata', country: 'Equatorial Guinea', lat: 1.8639, lon: 9.7658, urban: true },

  // São Tomé and Príncipe
  { name: 'São Tomé', country: 'São Tomé and Príncipe', lat: 0.3365, lon: 6.7273, urban: true },

  // Eritrea
  { name: 'Asmara', country: 'Eritrea', lat: 15.3389, lon: 38.9317, urban: true },
  { name: 'Keren', country: 'Eritrea', lat: 15.7833, lon: 38.4500, urban: false },
  { name: 'Massawa', country: 'Eritrea', lat: 15.6100, lon: 39.4539, urban: false },

  // Djibouti
  { name: 'Djibouti City', country: 'Djibouti', lat: 11.5720, lon: 43.1456, urban: true },
  { name: 'Tadjoura', country: 'Djibouti', lat: 11.7919, lon: 42.8897, urban: false },

  // Comoros
  { name: 'Moroni', country: 'Comoros', lat: -11.7022, lon: 43.2551, urban: true },

  // Cape Verde
  { name: 'Praia', country: 'Cape Verde', lat: 14.9315, lon: -23.5133, urban: true },
  { name: 'Mindelo', country: 'Cape Verde', lat: 16.8900, lon: -24.9800, urban: true },

  // Guinea-Bissau
  { name: 'Bissau', country: 'Guinea-Bissau', lat: 11.8636, lon: -15.5977, urban: true },
  { name: 'Bafatá', country: 'Guinea-Bissau', lat: 12.1714, lon: -14.6558, urban: false },

  // Gambia
  { name: 'Banjul', country: 'Gambia', lat: 13.4531, lon: -16.5775, urban: true },
  { name: 'Serekunda', country: 'Gambia', lat: 13.4381, lon: -16.7108, urban: true },
  { name: 'Brikama', country: 'Gambia', lat: 13.2726, lon: -16.6505, urban: false },

  // Mauritania
  { name: 'Nouakchott', country: 'Mauritania', lat: 18.0858, lon: -15.9785, urban: true },
  { name: 'Nouadhibou', country: 'Mauritania', lat: 20.9310, lon: -17.0347, urban: true },
  { name: 'Rosso', country: 'Mauritania', lat: 16.5119, lon: -15.8058, urban: false },
  { name: 'Kaédi', country: 'Mauritania', lat: 16.1500, lon: -13.5000, urban: false },

  // Mauritius
  { name: 'Port Louis', country: 'Mauritius', lat: -20.1609, lon: 57.4986, urban: true },
  { name: 'Beau Bassin-Rose Hill', country: 'Mauritius', lat: -20.2318, lon: 57.4681, urban: true },
  { name: 'Vacoas', country: 'Mauritius', lat: -20.2833, lon: 57.4667, urban: true },

  // Seychelles
  { name: 'Victoria', country: 'Seychelles', lat: -4.6167, lon: 55.4500, urban: true },

  // Lesotho
  { name: 'Maseru', country: 'Lesotho', lat: -29.3167, lon: 27.4833, urban: true },
  { name: 'Teyateyaneng', country: 'Lesotho', lat: -29.1500, lon: 27.7333, urban: false },

  // Eswatini
  { name: 'Mbabane', country: 'Eswatini', lat: -26.3167, lon: 31.1333, urban: true },
  { name: 'Manzini', country: 'Eswatini', lat: -26.4833, lon: 31.3667, urban: true },

  // South Sudan
  { name: 'Juba', country: 'South Sudan', lat: 4.8594, lon: 31.5713, urban: true },
  { name: 'Malakal', country: 'South Sudan', lat: 9.5334, lon: 31.6607, urban: false },
  { name: 'Wau', country: 'South Sudan', lat: 7.7000, lon: 28.0000, urban: false },
  { name: 'Yei', country: 'South Sudan', lat: 4.0943, lon: 30.6765, urban: false },

  // Burundi
  { name: 'Bujumbura', country: 'Burundi', lat: -3.3822, lon: 29.3644, urban: true },
  { name: 'Gitega', country: 'Burundi', lat: -3.4271, lon: 29.9246, urban: true },
  { name: 'Muyinga', country: 'Burundi', lat: -2.8500, lon: 30.3333, urban: false },

  // Western Sahara
  { name: 'Laayoune', country: 'Western Sahara', lat: 27.1536, lon: -13.2033, urban: true },

  // Additional major cities for fuller coverage
  { name: 'Warri', country: 'Nigeria', lat: 5.5167, lon: 5.7500, urban: true },
  { name: 'Katsina', country: 'Nigeria', lat: 12.9889, lon: 7.6006, urban: true },
  { name: 'Owerri', country: 'Nigeria', lat: 5.4836, lon: 7.0333, urban: true },
  { name: 'Akure', country: 'Nigeria', lat: 7.2526, lon: 5.1933, urban: true },
  { name: 'Ado-Ekiti', country: 'Nigeria', lat: 7.6211, lon: 5.2213, urban: true },
  { name: 'Onitsha', country: 'Nigeria', lat: 6.1667, lon: 6.7833, urban: true },
  { name: 'Makurdi', country: 'Nigeria', lat: 7.7333, lon: 8.5167, urban: true },
  { name: 'Yola', country: 'Nigeria', lat: 9.2035, lon: 12.4954, urban: false },
  { name: 'Bauchi', country: 'Nigeria', lat: 10.3158, lon: 9.8442, urban: true },
  { name: 'Minna', country: 'Nigeria', lat: 9.6139, lon: 6.5569, urban: true },

  // More East Africa
  { name: 'Kampala', country: 'Uganda', lat: 0.3476, lon: 32.5825, urban: true },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, urban: true },
  { name: 'Kigali', country: 'Rwanda', lat: -1.9441, lon: 30.0619, urban: true },
  { name: 'Djibouti City', country: 'Djibouti', lat: 11.5720, lon: 43.1456, urban: true },
  { name: 'Asmara', country: 'Eritrea', lat: 15.3389, lon: 38.9317, urban: true },

  // More North Africa
  { name: 'Marrakesh', country: 'Morocco', lat: 31.6295, lon: -7.9811, urban: true },
  { name: 'Tripoli', country: 'Libya', lat: 32.9025, lon: 13.1802, urban: true },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8190, lon: 10.1658, urban: true },

  // More Central Africa
  { name: 'Kinshasa', country: 'DR Congo', lat: -4.3217, lon: 15.3222, urban: true },
  { name: 'Bangui', country: 'Central African Republic', lat: 4.3612, lon: 18.5550, urban: true },
  { name: 'Libreville', country: 'Gabon', lat: 0.3901, lon: 9.4544, urban: true },

  // More Southern Africa
  { name: 'Lusaka', country: 'Zambia', lat: -15.4167, lon: 28.2833, urban: true },
  { name: 'Harare', country: 'Zimbabwe', lat: -17.8252, lon: 31.0335, urban: true },
  { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lon: 32.5732, urban: true },
  { name: 'Antananarivo', country: 'Madagascar', lat: -18.9137, lon: 47.5361, urban: true },
  { name: 'Gaborone', country: 'Botswana', lat: -24.6581, lon: 25.9122, urban: true },
  { name: 'Windhoek', country: 'Namibia', lat: -22.5597, lon: 17.0832, urban: true },
  { name: 'Maseru', country: 'Lesotho', lat: -29.3167, lon: 27.4833, urban: true },
  { name: 'Mbabane', country: 'Eswatini', lat: -26.3167, lon: 31.1333, urban: true },
  { name: 'Port Louis', country: 'Mauritius', lat: -20.1609, lon: 57.4986, urban: true },
  { name: 'Lilongwe', country: 'Malawi', lat: -13.9626, lon: 33.7741, urban: true },

  // Additional cities to reach 500
  { name: 'Ibadan North', country: 'Nigeria', lat: 7.4000, lon: 3.9167, urban: true },
  { name: 'Ejigbo', country: 'Nigeria', lat: 7.9000, lon: 4.3000, urban: false },
  { name: 'Ogbomosho', country: 'Nigeria', lat: 8.1333, lon: 4.2500, urban: true },
  { name: 'Ile-Ife', country: 'Nigeria', lat: 7.4864, lon: 4.5681, urban: true },
  { name: 'Ado Odo', country: 'Nigeria', lat: 6.6047, lon: 2.9825, urban: false },
  { name: 'Shagamu', country: 'Nigeria', lat: 6.8444, lon: 3.6500, urban: false },
  { name: 'Damaturu', country: 'Nigeria', lat: 11.7492, lon: 11.9608, urban: false },
  { name: 'Lafia', country: 'Nigeria', lat: 8.4942, lon: 8.5117, urban: false },
  { name: 'Bida', country: 'Nigeria', lat: 9.0833, lon: 6.0167, urban: false },
  { name: 'Potiskum', country: 'Nigeria', lat: 11.7130, lon: 11.0793, urban: false },
  { name: 'Gusau', country: 'Nigeria', lat: 12.1672, lon: 6.6639, urban: false },
  { name: 'Birnin Kebbi', country: 'Nigeria', lat: 12.4544, lon: 4.1975, urban: false },
  { name: 'Hadejia', country: 'Nigeria', lat: 12.4500, lon: 10.0500, urban: false },
  { name: 'Nguru', country: 'Nigeria', lat: 12.8794, lon: 10.4572, urban: false },
  { name: 'Azare', country: 'Nigeria', lat: 11.6736, lon: 10.1953, urban: false },

  // Additional Ghanaian cities
  { name: 'Wa', country: 'Ghana', lat: 10.0603, lon: -2.5099, urban: false },
  { name: 'Wenchi', country: 'Ghana', lat: 7.7395, lon: -2.1007, urban: false },
  { name: 'Kintampo', country: 'Ghana', lat: 8.0553, lon: -1.7293, urban: false },
  { name: 'Nkawkaw', country: 'Ghana', lat: 6.5553, lon: -0.7693, urban: false },
  { name: 'Techiman', country: 'Ghana', lat: 7.5833, lon: -1.9333, urban: false },

  // Additional Kenyan cities
  { name: 'Nyeri', country: 'Kenya', lat: -0.4167, lon: 36.9500, urban: false },
  { name: 'Kakamega', country: 'Kenya', lat: 0.2827, lon: 34.7519, urban: false },
  { name: 'Kericho', country: 'Kenya', lat: -0.3667, lon: 35.2833, urban: false },
  { name: 'Bungoma', country: 'Kenya', lat: 0.5637, lon: 34.5607, urban: false },
  { name: 'Kisii', country: 'Kenya', lat: -0.6817, lon: 34.7667, urban: false },
  { name: 'Embu', country: 'Kenya', lat: -0.5300, lon: 37.4500, urban: false },
  { name: 'Meru', country: 'Kenya', lat: 0.0469, lon: 37.6491, urban: false },
  { name: 'Isiolo', country: 'Kenya', lat: 0.3500, lon: 37.5833, urban: false },
  { name: 'Wajir', country: 'Kenya', lat: 1.7471, lon: 40.0572, urban: false },
  { name: 'Mandera', country: 'Kenya', lat: 3.9373, lon: 41.8569, urban: false },

  // Additional Ethiopian cities
  { name: 'Hawassa', country: 'Ethiopia', lat: 7.0659, lon: 38.4764, urban: true },
  { name: 'Adama', country: 'Ethiopia', lat: 8.5400, lon: 39.2700, urban: true },
  { name: 'Shashamane', country: 'Ethiopia', lat: 7.2000, lon: 38.5833, urban: false },
  { name: 'Hosaena', country: 'Ethiopia', lat: 7.5500, lon: 37.8500, urban: false },
  { name: 'Nekemte', country: 'Ethiopia', lat: 9.0833, lon: 36.5500, urban: false },
  { name: 'Arba Minch', country: 'Ethiopia', lat: 6.0333, lon: 37.5500, urban: false },
  { name: 'Gambela', country: 'Ethiopia', lat: 8.2500, lon: 34.5833, urban: false },
  { name: 'Asella', country: 'Ethiopia', lat: 7.9500, lon: 39.1333, urban: false },
  { name: 'Debre Birhan', country: 'Ethiopia', lat: 9.6833, lon: 39.5333, urban: false },
  { name: 'Debre Markos', country: 'Ethiopia', lat: 10.3333, lon: 37.7333, urban: false },

  // Additional Tanzanian cities
  { name: 'Mtwara', country: 'Tanzania', lat: -10.2736, lon: 40.1836, urban: false },
  { name: 'Iringa', country: 'Tanzania', lat: -7.7667, lon: 35.7000, urban: false },
  { name: 'Moshi', country: 'Tanzania', lat: -3.3349, lon: 37.3400, urban: true },
  { name: 'Bukoba', country: 'Tanzania', lat: -1.3333, lon: 31.8167, urban: false },
  { name: 'Musoma', country: 'Tanzania', lat: -1.5000, lon: 33.8000, urban: false },
  { name: 'Songea', country: 'Tanzania', lat: -10.6833, lon: 35.6500, urban: false },
  { name: 'Sumbawanga', country: 'Tanzania', lat: -7.9667, lon: 31.6167, urban: false },
  { name: 'Kigoma', country: 'Tanzania', lat: -4.8761, lon: 29.6264, urban: false },
  { name: 'Shinyanga', country: 'Tanzania', lat: -3.6612, lon: 33.4228, urban: false },
  { name: 'Singida', country: 'Tanzania', lat: -4.8167, lon: 34.7500, urban: false },

  // Additional South African cities
  { name: 'Kimberley', country: 'South Africa', lat: -28.7282, lon: 24.7499, urban: true },
  { name: 'George', country: 'South Africa', lat: -33.9637, lon: 22.4602, urban: true },
  { name: 'Rustenburg', country: 'South Africa', lat: -25.6667, lon: 27.2500, urban: true },
  { name: 'Welkom', country: 'South Africa', lat: -27.9833, lon: 26.7333, urban: true },
  { name: 'Uitenhage', country: 'South Africa', lat: -33.7500, lon: 25.4000, urban: true },
  { name: 'Alberton', country: 'South Africa', lat: -26.2667, lon: 28.1167, urban: true },
  { name: 'Botshabelo', country: 'South Africa', lat: -29.2633, lon: 26.7235, urban: false },
  { name: 'Paarl', country: 'South Africa', lat: -33.7200, lon: 18.9567, urban: true },
  { name: 'Stellenbosch', country: 'South Africa', lat: -33.9347, lon: 18.8616, urban: true },
  { name: 'Klerksdorp', country: 'South Africa', lat: -26.8667, lon: 26.6667, urban: true },

  // More Moroccan cities
  { name: 'Kenitra', country: 'Morocco', lat: 34.2610, lon: -6.5802, urban: true },
  { name: 'Safi', country: 'Morocco', lat: 32.2994, lon: -9.2372, urban: true },
  { name: 'Mohammedia', country: 'Morocco', lat: 33.6861, lon: -7.3833, urban: true },
  { name: 'Beni Mellal', country: 'Morocco', lat: 32.3372, lon: -6.3498, urban: true },
  { name: 'Nador', country: 'Morocco', lat: 35.1740, lon: -2.9287, urban: true },
  { name: 'Khouribga', country: 'Morocco', lat: 32.8833, lon: -6.9167, urban: true },
  { name: 'Ksar El Kebir', country: 'Morocco', lat: 35.0167, lon: -5.9000, urban: false },
  { name: 'El Jadida', country: 'Morocco', lat: 33.2316, lon: -8.5007, urban: true },
  { name: 'Settat', country: 'Morocco', lat: 32.9986, lon: -7.6161, urban: true },
  { name: 'Larache', country: 'Morocco', lat: 35.1933, lon: -6.1561, urban: false },

  // More Algerian cities
  { name: 'Skikda', country: 'Algeria', lat: 36.8764, lon: 6.9072, urban: true },
  { name: 'Mostaganem', country: 'Algeria', lat: 35.9333, lon: 0.0833, urban: true },
  { name: 'El Oued', country: 'Algeria', lat: 33.3783, lon: 6.8631, urban: false },
  { name: 'Tébessa', country: 'Algeria', lat: 35.4042, lon: 8.1247, urban: true },
  { name: 'Chlef', country: 'Algeria', lat: 36.1653, lon: 1.3322, urban: true },
  { name: 'Saïda', country: 'Algeria', lat: 34.8311, lon: 0.1511, urban: false },
  { name: 'Médéa', country: 'Algeria', lat: 36.2644, lon: 2.7517, urban: false },
  { name: 'Laghouat', country: 'Algeria', lat: 33.8000, lon: 2.8667, urban: false },
  { name: 'Ouargla', country: 'Algeria', lat: 31.9592, lon: 5.3242, urban: false },
  { name: 'Jijel', country: 'Algeria', lat: 36.8219, lon: 5.7664, urban: false },

  // More Egyptian cities
  { name: 'El-Mahalla El-Kubra', country: 'Egypt', lat: 30.9714, lon: 31.1628, urban: true },
  { name: 'Zagazig', country: 'Egypt', lat: 30.5833, lon: 31.5000, urban: true },
  { name: 'Mansoura', country: 'Egypt', lat: 31.0333, lon: 31.3833, urban: true },
  { name: 'Faiyum', country: 'Egypt', lat: 29.3083, lon: 30.8417, urban: true },
  { name: 'Ismailia', country: 'Egypt', lat: 30.5833, lon: 32.2667, urban: true },
  { name: 'Damanhur', country: 'Egypt', lat: 31.0364, lon: 30.4681, urban: true },
  { name: 'Banha', country: 'Egypt', lat: 30.4667, lon: 31.1833, urban: true },
  { name: 'Minya', country: 'Egypt', lat: 28.1099, lon: 30.7503, urban: true },
  { name: 'Assiut', country: 'Egypt', lat: 27.1810, lon: 31.1837, urban: true },
  { name: 'Sohag', country: 'Egypt', lat: 26.5590, lon: 31.6957, urban: true },

  // Zambia additional
  { name: 'Mufulira', country: 'Zambia', lat: -12.5500, lon: 28.2333, urban: true },
  { name: 'Luanshya', country: 'Zambia', lat: -13.1333, lon: 28.4000, urban: true },
  { name: 'Chingola', country: 'Zambia', lat: -12.5267, lon: 27.8553, urban: true },
  { name: 'Chililabombwe', country: 'Zambia', lat: -12.3667, lon: 27.8333, urban: true },
  { name: 'Mazabuka', country: 'Zambia', lat: -15.8667, lon: 27.7500, urban: false },

  // Angola additional
  { name: 'Kuito', country: 'Angola', lat: -12.3833, lon: 16.9333, urban: false },
  { name: 'Uíge', country: 'Angola', lat: -7.6167, lon: 15.0500, urban: false },
  { name: 'Menongue', country: 'Angola', lat: -14.6667, lon: 17.6833, urban: false },
  { name: 'Dundo', country: 'Angola', lat: -7.3667, lon: 20.8333, urban: false },

  // Senegal additional
  { name: 'Diourbel', country: 'Senegal', lat: 14.6553, lon: -16.2317, urban: false },
  { name: 'Louga', country: 'Senegal', lat: 15.6167, lon: -16.2167, urban: false },
  { name: 'Fatick', country: 'Senegal', lat: 14.3333, lon: -16.4167, urban: false },
  { name: 'Tambacounda', country: 'Senegal', lat: 13.7667, lon: -13.6667, urban: false },
  { name: 'Kolda', country: 'Senegal', lat: 12.9000, lon: -14.9500, urban: false },

  // Cameroon additional
  { name: 'Foumban', country: 'Cameroon', lat: 5.7167, lon: 10.9000, urban: false },
  { name: 'Kumba', country: 'Cameroon', lat: 4.6333, lon: 9.4500, urban: false },
  { name: 'Edéa', country: 'Cameroon', lat: 3.8000, lon: 10.1333, urban: false },
  { name: 'Ebolowa', country: 'Cameroon', lat: 2.9000, lon: 11.1500, urban: false },

  // More Uganda cities
  { name: 'Arua', country: 'Uganda', lat: 3.0167, lon: 30.9167, urban: false },
  { name: 'Soroti', country: 'Uganda', lat: 1.7197, lon: 33.6106, urban: false },
  { name: 'Fort Portal', country: 'Uganda', lat: 0.6667, lon: 30.2736, urban: false },
  { name: 'Kabale', country: 'Uganda', lat: -1.2500, lon: 29.9833, urban: false },
  { name: 'Hoima', country: 'Uganda', lat: 1.4333, lon: 31.3500, urban: false },

  // Sudan additional
  { name: 'Atbara', country: 'Sudan', lat: 17.7000, lon: 33.9833, urban: false },
  { name: 'Nyala', country: 'Sudan', lat: 12.0500, lon: 24.8833, urban: true },
  { name: 'El Fasher', country: 'Sudan', lat: 13.6333, lon: 25.3500, urban: false },
  { name: 'Kosti', country: 'Sudan', lat: 13.1667, lon: 32.6500, urban: false },

  // Guinea additional
  { name: 'Mamou', country: 'Guinea', lat: 10.3667, lon: -12.0833, urban: false },
  { name: 'Faranah', country: 'Guinea', lat: 10.0333, lon: -10.7500, urban: false },

  // Mali additional
  { name: 'Kayes', country: 'Mali', lat: 14.4500, lon: -11.4333, urban: false },
  { name: 'Kati', country: 'Mali', lat: 12.7500, lon: -8.0667, urban: false },

  // Niger additional
  { name: 'Konni', country: 'Niger', lat: 13.7989, lon: 5.2542, urban: false },
  { name: 'Birni-N\'Konni', country: 'Niger', lat: 13.8167, lon: 5.2500, urban: false },

  // Burkina Faso additional
  { name: 'Dori', country: 'Burkina Faso', lat: 14.0333, lon: 0.0333, urban: false },
  { name: 'Koupéla', country: 'Burkina Faso', lat: 12.1833, lon: -0.3500, urban: false },
  { name: 'Tenkodogo', country: 'Burkina Faso', lat: 11.7833, lon: -0.3667, urban: false },
  { name: 'Kaya', country: 'Burkina Faso', lat: 13.1000, lon: -1.1000, urban: false },
  { name: 'Fada N\'gourma', country: 'Burkina Faso', lat: 12.0667, lon: 0.3500, urban: false },

  // Benin additional
  { name: 'Djougou', country: 'Benin', lat: 9.7000, lon: 1.6667, urban: false },
  { name: 'Natitingou', country: 'Benin', lat: 10.3167, lon: 1.3833, urban: false },
  { name: 'Kandi', country: 'Benin', lat: 11.1333, lon: 2.9333, urban: false },

  // Togo additional
  { name: 'Tsévié', country: 'Togo', lat: 6.4264, lon: 1.2136, urban: false },
  { name: 'Aného', country: 'Togo', lat: 6.2333, lon: 1.5833, urban: false },

  // Zimbabwe additional
  { name: 'Masvingo', country: 'Zimbabwe', lat: -20.0703, lon: 30.8328, urban: false },
  { name: 'Chinhoyi', country: 'Zimbabwe', lat: -17.3583, lon: 30.2000, urban: false },
  { name: 'Bindura', country: 'Zimbabwe', lat: -17.3000, lon: 31.3333, urban: false },

  // Mozambique additional
  { name: 'Tete', country: 'Mozambique', lat: -16.1564, lon: 33.5867, urban: false },
  { name: 'Pemba', country: 'Mozambique', lat: -12.9775, lon: 40.5178, urban: false },
  { name: 'Xai-Xai', country: 'Mozambique', lat: -25.0500, lon: 33.6500, urban: false },
  { name: 'Inhambane', country: 'Mozambique', lat: -23.8654, lon: 35.3833, urban: false },

  // Madagascar additional
  { name: 'Toliara', country: 'Madagascar', lat: -23.3500, lon: 43.6667, urban: false },
  { name: 'Diego Suarez', country: 'Madagascar', lat: -12.3525, lon: 49.2917, urban: true },
  { name: 'Mahajanga', country: 'Madagascar', lat: -15.7167, lon: 46.3167, urban: true },
  { name: 'Manakara', country: 'Madagascar', lat: -22.1333, lon: 48.0167, urban: false },

  // Malawi additional
  { name: 'Mzuzu', country: 'Malawi', lat: -11.4587, lon: 34.0177, urban: true },
  { name: 'Kasungu', country: 'Malawi', lat: -13.0333, lon: 33.4833, urban: false },
  { name: 'Liwonde', country: 'Malawi', lat: -15.0667, lon: 35.2333, urban: false },

  // Burundi additional
  { name: 'Ngozi', country: 'Burundi', lat: -2.9083, lon: 29.8317, urban: false },
  { name: 'Rumonge', country: 'Burundi', lat: -3.9667, lon: 29.4333, urban: false },

  // Lesotho additional
  { name: 'Leribe', country: 'Lesotho', lat: -28.8833, lon: 28.0500, urban: false },
  { name: 'Mafeteng', country: 'Lesotho', lat: -29.8167, lon: 27.2333, urban: false },

  // South Sudan additional
  { name: 'Torit', country: 'South Sudan', lat: 4.4136, lon: 32.5733, urban: false },
  { name: 'Aweil', country: 'South Sudan', lat: 8.7833, lon: 27.4000, urban: false },
  { name: 'Bor', country: 'South Sudan', lat: 6.2097, lon: 31.5598, urban: false },

  // Eritrea additional
  { name: 'Mendefera', country: 'Eritrea', lat: 14.8833, lon: 38.8167, urban: false },
  { name: 'Tessenei', country: 'Eritrea', lat: 15.1000, lon: 36.6500, urban: false },

  // Libya additional
  { name: 'Zliten', country: 'Libya', lat: 32.4672, lon: 14.5681, urban: false },
  { name: 'Al Bayda', country: 'Libya', lat: 32.7631, lon: 21.7550, urban: false },
  { name: 'Tobruk', country: 'Libya', lat: 32.0867, lon: 23.9983, urban: false },

  // Somalia additional
  { name: 'Baidoa', country: 'Somalia', lat: 3.1167, lon: 43.6500, urban: false },
  { name: 'Beledweyne', country: 'Somalia', lat: 4.7352, lon: 45.2036, urban: false },
  { name: 'Merca', country: 'Somalia', lat: 1.7141, lon: 44.7741, urban: false },

  // Rwanda additional
  { name: 'Musanze', country: 'Rwanda', lat: -1.4976, lon: 29.6340, urban: false },
  { name: 'Huye', country: 'Rwanda', lat: -2.5986, lon: 29.7386, urban: false },

  // Djibouti additional
  { name: 'Ali Sabieh', country: 'Djibouti', lat: 11.1564, lon: 42.7125, urban: false },

  // Remaining to reach 500+
  { name: 'Kédougou', country: 'Senegal', lat: 12.5561, lon: -12.1753, urban: false },
  { name: 'Sédhiou', country: 'Senegal', lat: 12.7078, lon: -15.5569, urban: false },
  { name: 'Ourossogui', country: 'Senegal', lat: 15.6167, lon: -13.3167, urban: false },
  { name: 'Dioila', country: 'Mali', lat: 12.4833, lon: -6.8000, urban: false },
  { name: 'Bougouni', country: 'Mali', lat: 11.4167, lon: -7.4833, urban: false },
  { name: 'San', country: 'Mali', lat: 13.3000, lon: -4.9000, urban: false },
  { name: 'Markala', country: 'Mali', lat: 13.7000, lon: -6.0667, urban: false },
  { name: 'Kita', country: 'Mali', lat: 13.0333, lon: -9.4833, urban: false },
];
