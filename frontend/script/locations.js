/* ============================================================
   locations.js — Country / State / City data
   ============================================================ */

const LOCATIONS = {
  "India": {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
    "Manipur": ["Imphal"],
    "Meghalaya": ["Shillong"],
    "Mizoram": ["Aizawl"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
    "Sikkim": ["Gangtok"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
    "Telangana": ["Hyderabad", "Warangal", "Karimnagar"],
    "Tripura": ["Agartala"],
    "Uttar Pradesh": ["Lucknow", "Noida", "Varanasi", "Agra", "Kanpur", "Prayagraj"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri"],
    "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket"],
    "Jammu & Kashmir": ["Srinagar", "Jammu"],
    "Ladakh": ["Leh", "Kargil"],
    "Chandigarh": ["Chandigarh"],
    "Puducherry": ["Puducherry"],
    "Lakshadweep": ["Kavaratti"]
  },
  "United States": {
    "Alabama": ["Birmingham", "Montgomery", "Huntsville"],
    "Alaska": ["Anchorage", "Fairbanks", "Juneau"],
    "Arizona": ["Phoenix", "Tucson", "Scottsdale", "Mesa"],
    "Arkansas": ["Little Rock", "Fayetteville", "Fort Smith"],
    "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland"],
    "Colorado": ["Denver", "Colorado Springs", "Boulder"],
    "Connecticut": ["Hartford", "New Haven", "Stamford"],
    "Delaware": ["Wilmington", "Dover"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"],
    "Georgia": ["Atlanta", "Savannah", "Augusta"],
    "Hawaii": ["Honolulu", "Maui"],
    "Idaho": ["Boise", "Idaho Falls"],
    "Illinois": ["Chicago", "Springfield", "Naperville"],
    "Indiana": ["Indianapolis", "Fort Wayne", "Bloomington"],
    "Iowa": ["Des Moines", "Cedar Rapids"],
    "Kansas": ["Wichita", "Kansas City", "Topeka"],
    "Kentucky": ["Louisville", "Lexington", "Frankfort"],
    "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport"],
    "Maine": ["Portland", "Augusta"],
    "Maryland": ["Baltimore", "Annapolis", "Bethesda"],
    "Massachusetts": ["Boston", "Cambridge", "Worcester"],
    "Michigan": ["Detroit", "Grand Rapids", "Ann Arbor"],
    "Minnesota": ["Minneapolis", "Saint Paul", "Bloomington"],
    "Mississippi": ["Jackson", "Gulfport"],
    "Missouri": ["Kansas City", "St. Louis", "Springfield"],
    "Montana": ["Billings", "Missoula", "Helena"],
    "Nebraska": ["Omaha", "Lincoln"],
    "Nevada": ["Las Vegas", "Reno", "Henderson"],
    "New Hampshire": ["Manchester", "Concord"],
    "New Jersey": ["Newark", "Jersey City", "Princeton"],
    "New Mexico": ["Albuquerque", "Santa Fe", "Las Cruces"],
    "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
    "North Carolina": ["Charlotte", "Raleigh", "Durham", "Asheville"],
    "North Dakota": ["Fargo", "Bismarck"],
    "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo"],
    "Oklahoma": ["Oklahoma City", "Tulsa", "Norman"],
    "Oregon": ["Portland", "Eugene", "Salem"],
    "Pennsylvania": ["Philadelphia", "Pittsburgh", "Harrisburg"],
    "Rhode Island": ["Providence", "Newport"],
    "South Carolina": ["Charleston", "Columbia", "Myrtle Beach"],
    "South Dakota": ["Sioux Falls", "Rapid City"],
    "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"],
    "Utah": ["Salt Lake City", "Provo", "Park City"],
    "Vermont": ["Burlington", "Montpelier"],
    "Virginia": ["Richmond", "Virginia Beach", "Arlington", "Norfolk"],
    "Washington": ["Seattle", "Spokane", "Tacoma", "Bellevue"],
    "West Virginia": ["Charleston", "Huntington"],
    "Wisconsin": ["Milwaukee", "Madison", "Green Bay"],
    "Wyoming": ["Cheyenne", "Jackson"]
  },
  "United Kingdom": {
    "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol", "Sheffield", "Cambridge", "Oxford"],
    "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
    "Wales": ["Cardiff", "Swansea", "Newport"],
    "Northern Ireland": ["Belfast", "Derry"]
  },
  "Canada": {
    "Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London"],
    "Quebec": ["Montreal", "Quebec City", "Laval"],
    "British Columbia": ["Vancouver", "Victoria", "Surrey"],
    "Alberta": ["Calgary", "Edmonton", "Red Deer"],
    "Manitoba": ["Winnipeg", "Brandon"],
    "Saskatchewan": ["Saskatoon", "Regina"],
    "Nova Scotia": ["Halifax"],
    "New Brunswick": ["Fredericton", "Moncton"]
  },
  "Australia": {
    "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
    "Victoria": ["Melbourne", "Geelong", "Ballarat"],
    "Queensland": ["Brisbane", "Gold Coast", "Cairns", "Sunshine Coast"],
    "Western Australia": ["Perth", "Fremantle"],
    "South Australia": ["Adelaide"],
    "Tasmania": ["Hobart", "Launceston"],
    "ACT": ["Canberra"],
    "NT": ["Darwin", "Alice Springs"]
  },
  "Germany": {
    "Bavaria": ["Munich", "Nuremberg", "Augsburg"],
    "Berlin": ["Berlin"],
    "Hamburg": ["Hamburg"],
    "Hesse": ["Frankfurt", "Wiesbaden"],
    "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund"],
    "Lower Saxony": ["Hannover", "Bremen"],
    "Baden-Württemberg": ["Stuttgart", "Freiburg", "Heidelberg"],
    "Saxony": ["Dresden", "Leipzig"]
  },
  "France": {
    "Île-de-France": ["Paris", "Versailles", "Boulogne-Billancourt"],
    "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Cannes"],
    "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble", "Saint-Étienne"],
    "Nouvelle-Aquitaine": ["Bordeaux", "Limoges"],
    "Occitanie": ["Toulouse", "Montpellier", "Nîmes"],
    "Hauts-de-France": ["Lille", "Amiens"],
    "Grand Est": ["Strasbourg", "Metz", "Nancy"],
    "Brittany": ["Rennes", "Brest"]
  },
  "Japan": {
    "Tokyo": ["Tokyo", "Shinjuku", "Shibuya", "Harajuku"],
    "Osaka": ["Osaka", "Kobe", "Kyoto", "Nara"],
    "Aichi": ["Nagoya"],
    "Hokkaido": ["Sapporo"],
    "Fukuoka": ["Fukuoka", "Kitakyushu"],
    "Hiroshima": ["Hiroshima"],
    "Kanagawa": ["Yokohama", "Kawasaki"]
  },
  "South Korea": {
    "Seoul": ["Seoul", "Gangnam", "Itaewon", "Hongdae"],
    "Busan": ["Busan"],
    "Incheon": ["Incheon"],
    "Daegu": ["Daegu"],
    "Gyeonggi": ["Suwon", "Seongnam", "Goyang"]
  },
  "UAE": {
    "Dubai": ["Dubai", "Jumeirah", "Marina", "Deira"],
    "Abu Dhabi": ["Abu Dhabi", "Al Ain"],
    "Sharjah": ["Sharjah"],
    "Ajman": ["Ajman"]
  },
  "Singapore": {
    "Central Region": ["Marina Bay", "Orchard", "Bugis", "Sentosa"],
    "East Region": ["Tampines", "Changi"],
    "West Region": ["Jurong", "Bukit Timah"],
    "North Region": ["Woodlands", "Yishun"]
  },
  "Brazil": {
    "São Paulo": ["São Paulo", "Campinas"],
    "Rio de Janeiro": ["Rio de Janeiro", "Niterói"],
    "Minas Gerais": ["Belo Horizonte"],
    "Bahia": ["Salvador"],
    "Paraná": ["Curitiba"],
    "Rio Grande do Sul": ["Porto Alegre"]
  },
  "South Africa": {
    "Gauteng": ["Johannesburg", "Pretoria", "Sandton"],
    "Western Cape": ["Cape Town", "Stellenbosch"],
    "KwaZulu-Natal": ["Durban", "Pietermaritzburg"],
    "Eastern Cape": ["Port Elizabeth"]
  },
  "Nigeria": {
    "Lagos": ["Lagos", "Ikeja", "Victoria Island"],
    "Abuja": ["Abuja"],
    "Oyo": ["Ibadan"],
    "Rivers": ["Port Harcourt"]
  },
  "Thailand": {
    "Bangkok": ["Bangkok", "Sukhumvit", "Silom", "Chatuchak"],
    "Chiang Mai": ["Chiang Mai"],
    "Phuket": ["Phuket"],
    "Pattaya": ["Pattaya"]
  },
  "Indonesia": {
    "Jakarta": ["Jakarta", "Bandung"],
    "Bali": ["Denpasar", "Seminyak", "Ubud"],
    "East Java": ["Surabaya"],
    "Central Java": ["Semarang", "Yogyakarta"]
  },
  "Malaysia": {
    "Kuala Lumpur": ["Kuala Lumpur", "Petaling Jaya", "Bangsar"],
    "Penang": ["George Town"],
    "Johor": ["Johor Bahru"],
    "Sarawak": ["Kuching"]
  },
  "New Zealand": {
    "Auckland": ["Auckland"],
    "Wellington": ["Wellington"],
    "Canterbury": ["Christchurch"],
    "Waikato": ["Hamilton"]
  },
  "Italy": {
    "Lombardy": ["Milan", "Bergamo", "Brescia"],
    "Lazio": ["Rome", "Fiumicino"],
    "Campania": ["Naples"],
    "Tuscany": ["Florence", "Pisa", "Siena"],
    "Veneto": ["Venice", "Verona"],
    "Piedmont": ["Turin"],
    "Emilia-Romagna": ["Bologna"]
  },
  "Spain": {
    "Community of Madrid": ["Madrid"],
    "Catalonia": ["Barcelona"],
    "Andalusia": ["Seville", "Málaga", "Granada"],
    "Valencia": ["Valencia"],
    "Basque Country": ["Bilbao", "San Sebastián"]
  },
  "Netherlands": {
    "North Holland": ["Amsterdam", "Haarlem"],
    "South Holland": ["Rotterdam", "The Hague", "Leiden"],
    "Utrecht": ["Utrecht"],
    "North Brabant": ["Eindhoven", "Tilburg"]
  },
  "Sweden": {
    "Stockholm": ["Stockholm"],
    "Västra Götaland": ["Gothenburg"],
    "Skåne": ["Malmö"]
  },
  "Switzerland": {
    "Zurich": ["Zurich"],
    "Bern": ["Bern"],
    "Geneva": ["Geneva"],
    "Basel": ["Basel"],
    "Lucerne": ["Lucerne"]
  },
  "Saudi Arabia": {
    "Riyadh": ["Riyadh"],
    "Makkah": ["Mecca", "Jeddah"],
    "Eastern Province": ["Dammam", "Khobar"],
    "Madinah": ["Medina"]
  },
  "Turkey": {
    "Istanbul": ["Istanbul"],
    "Ankara": ["Ankara"],
    "Izmir": ["Izmir"],
    "Antalya": ["Antalya"],
    "Bursa": ["Bursa"]
  },
  "Egypt": {
    "Cairo": ["Cairo", "Giza"],
    "Alexandria": ["Alexandria"],
    "Luxor": ["Luxor"]
  },
  "Kenya": {
    "Nairobi": ["Nairobi"],
    "Mombasa": ["Mombasa"],
    "Kisumu": ["Kisumu"]
  },
  "Argentina": {
    "Buenos Aires": ["Buenos Aires"],
    "Córdoba": ["Córdoba"],
    "Santa Fe": ["Rosario"]
  },
  "Mexico": {
    "Mexico City": ["Mexico City"],
    "Jalisco": ["Guadalajara"],
    "Nuevo León": ["Monterrey"],
    "Quintana Roo": ["Cancún", "Tulum"]
  },
  "Ireland": {
    "Leinster": ["Dublin"],
    "Munster": ["Cork", "Limerick"],
    "Connacht": ["Galway"]
  },
  "Portugal": {
    "Lisbon": ["Lisbon", "Sintra"],
    "Porto": ["Porto"],
    "Faro": ["Faro", "Albufeira"]
  },
  "Norway": {
    "Oslo": ["Oslo"],
    "Vestland": ["Bergen"],
    "Trøndelag": ["Trondheim"]
  },
  "Denmark": {
    "Capital Region": ["Copenhagen"],
    "Central Denmark": ["Aarhus"],
    "Southern Denmark": ["Odense"]
  },
  "Finland": {
    "Uusimaa": ["Helsinki", "Espoo"],
    "Pirkanmaa": ["Tampere"],
    "Southwest Finland": ["Turku"]
  },
  "China": {
    "Beijing": ["Beijing"],
    "Shanghai": ["Shanghai"],
    "Guangdong": ["Guangzhou", "Shenzhen"],
    "Sichuan": ["Chengdu"],
    "Zhejiang": ["Hangzhou", "Ningbo"],
    "Jiangsu": ["Nanjing", "Suzhou"]
  },
  "Vietnam": {
    "Ho Chi Minh City": ["Ho Chi Minh City"],
    "Hanoi": ["Hanoi"],
    "Da Nang": ["Da Nang"],
    "Hai Phong": ["Hai Phong"]
  },
  "Philippines": {
    "Metro Manila": ["Manila", "Quezon City", "Makati", "BGC"],
    "Cebu": ["Cebu City"],
    "Davao": ["Davao City"]
  },
  "Sri Lanka": {
    "Western Province": ["Colombo", "Negombo"],
    "Central Province": ["Kandy"],
    "Southern Province": ["Galle", "Hambantota"]
  },
  "Nepal": {
    "Bagmati": ["Kathmandu", "Lalitpur", "Bhaktapur"],
    "Gandaki": ["Pokhara"],
    "Lumbini": ["Bhairahawa"]
  },
  "Bangladesh": {
    "Dhaka": ["Dhaka", "Gazipur"],
    "Chittagong": ["Chittagong"],
    "Khulna": ["Khulna"],
    "Rajshahi": ["Rajshahi"]
  },
  "Pakistan": {
    "Punjab": ["Lahore", "Rawalpindi", "Faisalabad", "Multan"],
    "Sindh": ["Karachi", "Hyderabad"],
    "Islamabad": ["Islamabad"],
    "Khyber Pakhtunkhwa": ["Peshawar"],
    "Balochistan": ["Quetta"]
  }
};
