// Sri Lanka Hospitals — sourced from Wikipedia: List of hospitals in Sri Lanka
// Organized by Province → District → Hospital

const SRI_LANKA_HOSPITALS = [
  // ─── WESTERN PROVINCE ───────────────────────────────────────────────
  // Colombo District
  { name: "National Hospital of Sri Lanka", city: "Colombo", district: "Colombo", province: "Western", type: "Teaching" },
  { name: "Lady Ridgeway Hospital for Children", city: "Colombo", district: "Colombo", province: "Western", type: "Teaching" },
  { name: "De Soysa Hospital for Women", city: "Colombo", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "Castle Street Hospital for Women", city: "Colombo", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "Chest Hospital Welisara", city: "Welisara", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "National Cancer Institute Maharagama", city: "Maharagama", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "Colombo South Teaching Hospital", city: "Kalubowila", district: "Colombo", province: "Western", type: "Teaching" },
  { name: "Angoda Mental Hospital", city: "Angoda", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "Colombo Eye Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "Ear, Nose & Throat Hospital Colombo", city: "Colombo", district: "Colombo", province: "Western", type: "Specialized" },
  { name: "Colombo North Teaching Hospital Ragama", city: "Ragama", district: "Gampaha", province: "Western", type: "Teaching" },
  { name: "Nawaloka Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Asiri Medical Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Asiri Surgical Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Lanka Hospitals Corporation", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Durdans Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Hemas Hospital Wattala", city: "Wattala", district: "Colombo", province: "Western", type: "Private" },
  { name: "Hemas Hospital Thalawathugoda", city: "Thalawathugoda", district: "Colombo", province: "Western", type: "Private" },
  { name: "Joseph Fraser Memorial Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Ninewells Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Winfield Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Golden Key Hospital", city: "Rajagiriya", district: "Colombo", province: "Western", type: "Private" },
  { name: "Kings Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Oasis Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },
  { name: "Suwasevana Hospital", city: "Sri Jayawardenepura", district: "Colombo", province: "Western", type: "Private" },
  { name: "Lal Medicals Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private" },

  // Gampaha District
  { name: "Negombo General Hospital", city: "Negombo", district: "Gampaha", province: "Western", type: "Government" },
  { name: "Gampaha General Hospital", city: "Gampaha", district: "Gampaha", province: "Western", type: "Government" },
  { name: "Wathupitiwala General Hospital", city: "Wathupitiwala", district: "Gampaha", province: "Western", type: "Government" },
  { name: "Minuwangoda Base Hospital", city: "Minuwangoda", district: "Gampaha", province: "Western", type: "Government" },
  { name: "Hemas Hospital Negombo", city: "Negombo", district: "Gampaha", province: "Western", type: "Private" },
  { name: "Nawaloka Hospitals Negombo", city: "Negombo", district: "Gampaha", province: "Western", type: "Private" },

  // Kalutara District
  { name: "Kalutara North District General Hospital", city: "Kalutara", district: "Kalutara", province: "Western", type: "Government" },
  { name: "Panadura Base Hospital", city: "Panadura", district: "Kalutara", province: "Western", type: "Government" },
  { name: "Horana Base Hospital", city: "Horana", district: "Kalutara", province: "Western", type: "Government" },
  { name: "Beruwela Base Hospital", city: "Beruwela", district: "Kalutara", province: "Western", type: "Government" },

  // ─── CENTRAL PROVINCE ───────────────────────────────────────────────
  // Kandy District
  { name: "National Hospital Kandy (Teaching)", city: "Kandy", district: "Kandy", province: "Central", type: "Teaching" },
  { name: "Sirimavo Bandaranaike Specialized Children's Hospital", city: "Peradeniya", district: "Kandy", province: "Central", type: "Teaching" },
  { name: "General Hospital Peradeniya", city: "Peradeniya", district: "Kandy", province: "Central", type: "Teaching" },
  { name: "Base Hospital Gampola", city: "Gampola", district: "Kandy", province: "Central", type: "Government" },
  { name: "District General Hospital Nawalapitiya", city: "Nawalapitiya", district: "Kandy", province: "Central", type: "Government" },
  { name: "Teldeniya District Hospital", city: "Teldeniya", district: "Kandy", province: "Central", type: "Government" },
  { name: "Lakeside Adventist Hospital", city: "Kandy", district: "Kandy", province: "Central", type: "Private" },
  { name: "Asiri Hospital Kandy", city: "Kandy", district: "Kandy", province: "Central", type: "Private" },
  { name: "Kandy Nursing Home", city: "Kandy", district: "Kandy", province: "Central", type: "Private" },

  // Matale District
  { name: "District General Hospital Matale", city: "Matale", district: "Matale", province: "Central", type: "Government" },
  { name: "Dambulla Base Hospital", city: "Dambulla", district: "Matale", province: "Central", type: "Government" },
  { name: "Co-operative Hospital Matale", city: "Matale", district: "Matale", province: "Central", type: "Private" },

  // Nuwara Eliya District
  { name: "Nuwara Eliya General Hospital", city: "Nuwara Eliya", district: "Nuwara Eliya", province: "Central", type: "Government" },
  { name: "Dickoya Base Hospital", city: "Dickoya", district: "Nuwara Eliya", province: "Central", type: "Government" },
  { name: "Hatton Base Hospital", city: "Hatton", district: "Nuwara Eliya", province: "Central", type: "Government" },

  // ─── SOUTHERN PROVINCE ──────────────────────────────────────────────
  // Galle District
  { name: "Karapitiya Teaching Hospital", city: "Karapitiya, Galle", district: "Galle", province: "Southern", type: "Teaching" },
  { name: "German-Sri Lanka Friendship Women's & Maternity Hospital", city: "Galle", district: "Galle", province: "Southern", type: "Specialized" },
  { name: "Baddegama District Hospital", city: "Baddegama", district: "Galle", province: "Southern", type: "Government" },
  { name: "Ambalangoda Base Hospital", city: "Ambalangoda", district: "Galle", province: "Southern", type: "Government" },
  { name: "Elpitiya Base Hospital", city: "Elpitiya", district: "Galle", province: "Southern", type: "Government" },
  { name: "Asiri Hospital Galle", city: "Galle", district: "Galle", province: "Southern", type: "Private" },
  { name: "Nawaloka Hospitals Galle", city: "Galle", district: "Galle", province: "Southern", type: "Private" },

  // Hambantota District
  { name: "Hambantota District General Hospital", city: "Hambantota", district: "Hambantota", province: "Southern", type: "Government" },
  { name: "Tissamaharama Base Hospital", city: "Debarawewa", district: "Hambantota", province: "Southern", type: "Government" },
  { name: "Tangalle Base Hospital", city: "Tangalle", district: "Hambantota", province: "Southern", type: "Government" },
  { name: "Holton Hospital", city: "Walasmulla", district: "Hambantota", province: "Southern", type: "Private" },

  // Matara District
  { name: "District General Hospital Matara", city: "Matara", district: "Matara", province: "Southern", type: "Government" },
  { name: "Kamburupitiya Base Hospital", city: "Kamburupitiya", district: "Matara", province: "Southern", type: "Government" },
  { name: "Weligama Base Hospital", city: "Weligama", district: "Matara", province: "Southern", type: "Government" },
  { name: "Asiri Hospital Matara", city: "Matara", district: "Matara", province: "Southern", type: "Private" },

  // ─── NORTHERN PROVINCE ──────────────────────────────────────────────
  { name: "Jaffna Teaching Hospital", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Teaching" },
  { name: "Point Pedro Base Hospital", city: "Point Pedro", district: "Jaffna", province: "Northern", type: "Government" },
  { name: "Mannar District General Hospital", city: "Mannar", district: "Mannar", province: "Northern", type: "Government" },
  { name: "Kilinochchi General Hospital", city: "Kilinochchi", district: "Kilinochchi", province: "Northern", type: "Government" },
  { name: "Mullaitivu General Hospital", city: "Mullaitivu", district: "Mullaitivu", province: "Northern", type: "Government" },
  { name: "Vavuniya General Hospital", city: "Vavuniya", district: "Vavuniya", province: "Northern", type: "Government" },

  // ─── EASTERN PROVINCE ───────────────────────────────────────────────
  { name: "Trincomalee District General Hospital", city: "Trincomalee", district: "Trincomalee", province: "Eastern", type: "Government" },
  { name: "Batticaloa Teaching Hospital", city: "Batticaloa", district: "Batticaloa", province: "Eastern", type: "Teaching" },
  { name: "Ampara District General Hospital", city: "Ampara", district: "Ampara", province: "Eastern", type: "Government" },
  { name: "Kalmunai District General Hospital", city: "Kalmunai", district: "Ampara", province: "Eastern", type: "Government" },
  { name: "Kalmunai Muslim Base Hospital", city: "Kalmunai", district: "Ampara", province: "Eastern", type: "Government" },
  { name: "Akkaraipattu Base Hospital", city: "Akkaraipattu", district: "Ampara", province: "Eastern", type: "Government" },

  // ─── NORTH CENTRAL PROVINCE ─────────────────────────────────────────
  { name: "District General Hospital Anuradhapura (Teaching)", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Teaching" },
  { name: "Royal Hospital Anuradhapura", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Private" },
  { name: "Suwa Shanthi Private Hospital", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Private" },
  { name: "District General Hospital Polonnaruwa", city: "Polonnaruwa", district: "Polonnaruwa", province: "North Central", type: "Government" },
  { name: "Sri Lanka-China Friendship Nephrology Hospital", city: "Polonnaruwa", district: "Polonnaruwa", province: "North Central", type: "Specialized" },

  // ─── NORTH WESTERN PROVINCE ─────────────────────────────────────────
  { name: "Teaching Hospital Kurunegala", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Teaching" },
  { name: "Alawwa District Hospital", city: "Alawwa", district: "Kurunegala", province: "North Western", type: "Government" },
  { name: "Kuliyapitiya Base Hospital", city: "Kuliyapitiya", district: "Kurunegala", province: "North Western", type: "Government" },
  { name: "Maho District Hospital", city: "Maho", district: "Kurunegala", province: "North Western", type: "Government" },
  { name: "Nawinna Hospital Kurunegala", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private" },
  { name: "Chilaw General Hospital", city: "Chilaw", district: "Puttalam", province: "North Western", type: "Government" },
  { name: "Puttalam Base Hospital", city: "Puttalam", district: "Puttalam", province: "North Western", type: "Government" },
  { name: "Marawila Base Hospital", city: "Marawila", district: "Puttalam", province: "North Western", type: "Government" },
  { name: "Life Care Hospital Wennappuwa", city: "Wennappuwa", district: "Puttalam", province: "North Western", type: "Private" },

  // ─── SABARAGAMUWA PROVINCE ───────────────────────────────────────────
  { name: "Ratnapura Teaching Hospital", city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", type: "Teaching" },
  { name: "Base Hospital Embilipitiya", city: "Embilipitiya", district: "Ratnapura", province: "Sabaragamuwa", type: "Government" },
  { name: "Base Hospital Balangoda", city: "Balangoda", district: "Ratnapura", province: "Sabaragamuwa", type: "Government" },
  { name: "Singhe Hospitals PLC Ratnapura", city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", type: "Private" },
  { name: "Teaching Hospital Kegalle", city: "Kegalle", district: "Kegalle", province: "Sabaragamuwa", type: "Teaching" },
  { name: "Base Hospital Mawanella", city: "Mawanella", district: "Kegalle", province: "Sabaragamuwa", type: "Government" },
  { name: "Base Hospital Warakapola", city: "Warakapola", district: "Kegalle", province: "Sabaragamuwa", type: "Government" },

  // ─── UVA PROVINCE ───────────────────────────────────────────────────
  { name: "Badulla Provincial General Hospital", city: "Badulla", district: "Badulla", province: "Uva", type: "Government" },
  { name: "Diyatalawa Base Hospital", city: "Diyatalawa", district: "Badulla", province: "Uva", type: "Government" },
  { name: "Welimada Base Hospital", city: "Welimada", district: "Badulla", province: "Uva", type: "Government" },
  { name: "Bandarawela Base Hospital", city: "Bandarawela", district: "Badulla", province: "Uva", type: "Government" },
  { name: "Monaragala District General Hospital", city: "Monaragala", district: "Monaragala", province: "Uva", type: "Government" },
  { name: "Wellawaya Base Hospital", city: "Wellawaya", district: "Monaragala", province: "Uva", type: "Government" },

  // ─── PHSRC REGISTERED PRIVATE HOSPITALS ────────────────────────────────────
  // Colombo District
  { name: "Nawaloka Hospitals PLC", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/01" },
  { name: "Kings Hospital Colombo", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/03" },
  { name: "Asiri Hospital Holdings PLC", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/05" },
  { name: "Asiri Surgical Hospital PLC", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/06" },
  { name: "Lanka Hospitals Corporation PLC", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/07" },
  { name: "Durdans Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/08" },
  { name: "Western Infirmary", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/10" },
  { name: "Joseph Fraser Memorial Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/12" },
  { name: "Healthscan Services", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/17" },
  { name: "The Ratnam Private Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/29" },
  { name: "Ninewells Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/35" },
  { name: "Dr. Hudson Silva Eye Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/39" },
  { name: "Park Hospitals", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/107" },
  { name: "Ceylinco Healthcare Services", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/123" },
  { name: "Ayush Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/142" },
  { name: "Central Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/167" },
  { name: "Winsetha Hospitals", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/197" },
  { name: "Vasan Healthcare Lanka", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/191" },
  { name: "ARC International Fertility & Research Centre", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/241" },
  { name: "Royal Care Hospital", city: "Colombo", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/84" },
  { name: "Golden Key Hospitals", city: "Rajagiriya", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/102" },
  { name: "Blue Cross Hospital", city: "Rajagiriya", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/276" },
  { name: "Santa Dora Hospital", city: "Battaramulla", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/207" },
  { name: "Lensetech Eye Care Hospital", city: "Battaramulla", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/324" },
  { name: "Nawinna Medicare Hospitals", city: "Maharagama", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/140" },
  { name: "Asia Hospital", city: "Maharagama", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/153" },
  { name: "Wish Fertility Hospital", city: "Maharagama", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/266" },
  { name: "Winlanka Hospital", city: "Nugegoda", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/70" },
  { name: "Ceymed Healthcare Services", city: "Nugegoda", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/321" },
  { name: "Vasana Hospital", city: "Dehiwala", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/235" },
  { name: "Medihelp Hospital Mount Lavinia", city: "Mount Lavinia", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/318" },
  { name: "Mount Lotus Eye & ENT Hospital", city: "Mount Lavinia", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/294" },
  { name: "Suwanetha Eye Hospital", city: "Gothatuwa", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/186" },
  { name: "Piliyandala Health Services", city: "Piliyandala", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/66" },
  { name: "Pannipitiya Medical Services", city: "Pannipitiya", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/09" },
  { name: "Kelani Valley Hospital", city: "Avissawella", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/34" },
  { name: "Gomez Hospital", city: "Avissawella", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/93" },
  { name: "Venus Hospital Avissawella", city: "Avissawella", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/201" },
  { name: "Alpha Lanka Diabetic Hospital", city: "Kalagedihena", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/204" },
  { name: "Makola Medicare Hospital", city: "Makola", district: "Colombo", province: "Western", type: "Private", reg: "PHSRC/PH/312" },

  // Gampaha District
  { name: "Leesons Hospital", city: "Ragama", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/16" },
  { name: "Peoples Hospital", city: "Ragama", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/20" },
  { name: "Melsta Hospitals Ragama", city: "Ragama", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/195" },
  { name: "Hemas Hospitals Wattala", city: "Wattala", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/138" },
  { name: "Lions Sight First Hospital", city: "Wattala", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/134" },
  { name: "Nightingale Hospitals", city: "Wattala", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/279" },
  { name: "Ave Maria Hospital", city: "Negombo", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/23" },
  { name: "The Dissanayake Private Hospital", city: "Negombo", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/98" },
  { name: "Nawaloka Medicare Negombo", city: "Negombo", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/211" },
  { name: "New Medicare Hospital", city: "Katunayake", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/108" },
  { name: "Co-operative Hospital Gampaha", city: "Gampaha", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/43" },
  { name: "Arogya Hospitals", city: "Gampaha", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/87" },
  { name: "Panora Eye Hospital", city: "Gampaha", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/278" },
  { name: "Oculus Gampaha Eye Meds", city: "Gampaha", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/251" },
  { name: "Ja-Ela Ragama Hospitals", city: "Ja-Ela", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/160" },
  { name: "Radiant Eye", city: "Ja-Ela", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/212" },
  { name: "Seeduwa Hospitals", city: "Seeduwa", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/295" },
  { name: "Bandaranayake Hospitals", city: "Wathupitiwala", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/64" },
  { name: "Sirisanda Samupa Suwa Sewana Hospital", city: "Nittambuwa", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/46" },
  { name: "Family Care Medical Service", city: "Kelaniya", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/226" },
  { name: "Viweka Hospital", city: "Veyangoda", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/126" },
  { name: "Sahanya Private Hospital", city: "Mirigama", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/227" },
  { name: "Rosewood Oral Care Center", city: "Kadawatha", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/293" },
  { name: "Suwasaviya Hospitals", city: "Divulapitiya", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/282" },
  { name: "Kingsway Medicoz", city: "Kirindiwela", district: "Gampaha", province: "Western", type: "Private", reg: "PHSRC/PH/228" },

  // Kalutara District
  { name: "New Philip Hospitals", city: "Kalutara", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/11" },
  { name: "Family Care Hospital Kalutara", city: "Kalutara", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/110" },
  { name: "Nawaloka Hospital Panadura", city: "Panadura", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/269" },
  { name: "Lions Gift Of Sight Hospital", city: "Panadura", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/151" },
  { name: "Sachitra Hospitals", city: "Panadura", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/158" },
  { name: "Swastha Hospital", city: "Panadura", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/325" },
  { name: "Vision Solutions Eye Care Hospital", city: "Panadura", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/231" },
  { name: "Medihelp Hospital Horana", city: "Horana", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/184" },
  { name: "MDK Healthcare Center & Hospital", city: "Horana", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/187" },
  { name: "Jeewaka Private Hospital", city: "Padukka", district: "Kalutara", province: "Western", type: "Private", reg: "PHSRC/PH/36" },

  // Kandy District
  { name: "The Kandy Private Hospitals", city: "Kandy", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/14" },
  { name: "Lakeside Adventist Hospital", city: "Kandy", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/38" },
  { name: "Suwasewana Hospitals Kandy", city: "Kandy", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/83" },
  { name: "Asiri Hospital Holdings Kandy", city: "Kandy", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/244" },
  { name: "Ferti Plus Hospital", city: "Kandy", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/268" },
  { name: "Kandy Central Hospital", city: "Gelioya", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/292" },
  { name: "Royal Care Hospital Akurana", city: "Akurana", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/183" },
  { name: "M.K. Hospital Gampola", city: "Gampola", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/90" },

  // Matale District
  { name: "Kumudu Hospital Matale", city: "Matale", district: "Matale", province: "Central", type: "Private", reg: "PHSRC/PH/73" },
  { name: "Matale Nursing Home", city: "Matale", district: "Matale", province: "Central", type: "Private", reg: "PHSRC/PH/176" },
  { name: "Medical Center Hospital Dambulla", city: "Dambulla", district: "Matale", province: "Central", type: "Private", reg: "PHSRC/PH/150" },
  { name: "Medicare Hospital Dambulla", city: "Dambulla", district: "Matale", province: "Central", type: "Private", reg: "PHSRC/PH/264" },

  // Nuwara Eliya District
  { name: "New Mount Hospital", city: "Hatton", district: "Nuwara Eliya", province: "Central", type: "Private", reg: "PHSRC/PH/280" },
  { name: "Nawalapitiya Nursing Home", city: "Nawalapitiya", district: "Kandy", province: "Central", type: "Private", reg: "PHSRC/PH/137" },

  // Galle District
  { name: "Asiri Hospital Galle", city: "Galle", district: "Galle", province: "Southern", type: "Private", reg: "PHSRC/PH/69" },
  { name: "Galle Co-operative Hospital", city: "Galle", district: "Galle", province: "Southern", type: "Private", reg: "PHSRC/PH/88" },
  { name: "Ruhunu Hospital Galle", city: "Galle", district: "Galle", province: "Southern", type: "Private", reg: "PHSRC/PH/89" },
  { name: "Queensbury Hospitals", city: "Galle", district: "Galle", province: "Southern", type: "Private", reg: "PHSRC/PH/255" },
  { name: "Roseth Hospital", city: "Ambalangoda", district: "Galle", province: "Southern", type: "Private", reg: "PHSRC/PH/63" },

  // Matara District
  { name: "Asiri Hospital Matara", city: "Matara", district: "Matara", province: "Southern", type: "Private", reg: "PHSRC/PH/18" },
  { name: "Matara District Co-operative Hospital", city: "Matara", district: "Matara", province: "Southern", type: "Private", reg: "PHSRC/PH/122" },
  { name: "Asia Medi Health Services Weligama", city: "Weligama", district: "Matara", province: "Southern", type: "Private", reg: "PHSRC/PH/299" },
  { name: "IMC Med Hospital Mirissa", city: "Mirissa", district: "Matara", province: "Southern", type: "Private", reg: "PHSRC/PH/297" },

  // Hambantota District
  { name: "Polyclinic Private Hospital", city: "Embilipitiya", district: "Hambantota", province: "Southern", type: "Private", reg: "PHSRC/PH/190" },
  { name: "Navodaya Hospital", city: "Embilipitiya", district: "Hambantota", province: "Southern", type: "Private", reg: "PHSRC/PH/263" },
  { name: "Balangoda Private Hospital", city: "Balangoda", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/216" },
  { name: "Life Care Hospital Balangoda", city: "Balangoda", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/247" },
  { name: "KMC Hospital Balangoda", city: "Balangoda", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/320" },

  // Ratnapura District
  { name: "Aloka Private Hospital", city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/49" },
  { name: "Singhe Hospitals PLC", city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/162" },
  { name: "Neth Setha Lions Vision Hospital", city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/182" },
  { name: "Ratnapura Hospitals & Laboratories", city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/225" },

  // Kegalle District
  { name: "Gamage Hospital", city: "Mawanella", district: "Kegalle", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/32" },
  { name: "OSRO Hospitals Mawanella", city: "Mawanella", district: "Kegalle", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/59" },
  { name: "OSRO Hospitals Kegalle", city: "Kegalle", district: "Kegalle", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/200" },
  { name: "Candela Hospital", city: "Kegalle", district: "Kegalle", province: "Sabaragamuwa", type: "Private", reg: "PHSRC/PH/257" },

  // Kurunegala District
  { name: "Seth Sevana Hospitals", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/24" },
  { name: "Nawinne Hospital", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/45" },
  { name: "Kurunegala Co-operative Hospital", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/115" },
  { name: "Sakuki Dental Hospital", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/224" },
  { name: "Suwasiri Piyasa Nursing Home", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/229" },
  { name: "Samarasinghe Eye Hospital", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/239" },
  { name: "Denetha Eye Care Center", city: "Kurunegala", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/240" },
  { name: "Siyasi Hospital", city: "Kuliyapitiya", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/105" },
  { name: "KMG Suwasewa Hospital", city: "Hettipola", district: "Kurunegala", province: "North Western", type: "Private", reg: "PHSRC/PH/217" },

  // Puttalam District
  { name: "Life Care Hospital Wennappuwa", city: "Wennappuwa", district: "Puttalam", province: "North Western", type: "Private", reg: "PHSRC/PH/19" },
  { name: "St. Annes Nursing Home", city: "Marawila", district: "Puttalam", province: "North Western", type: "Private", reg: "PHSRC/PH/104" },
  { name: "Suwaya Hospitals", city: "Chilaw", district: "Puttalam", province: "North Western", type: "Private", reg: "PHSRC/PH/112" },
  { name: "Balasooriya Hospital Chilaw", city: "Chilaw", district: "Puttalam", province: "North Western", type: "Private", reg: "PHSRC/PH/291" },
  { name: "New Puttalam Digasiri Hospital", city: "Puttalam", district: "Puttalam", province: "North Western", type: "Private", reg: "PHSRC/PH/253" },
  { name: "Balasooriya Hospital Puttalam", city: "Puttalam", district: "Puttalam", province: "North Western", type: "Private", reg: "PHSRC/PH/177" },

  // Anuradhapura District
  { name: "Suwa Shanthi Hospital", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Private", reg: "PHSRC/PH/31" },
  { name: "New Suwasewana Hospital", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Private", reg: "PHSRC/PH/223" },
  { name: "Kanola Hospital", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Private", reg: "PHSRC/PH/267" },
  { name: "Nethra Eye Hospital", city: "Anuradhapura", district: "Anuradhapura", province: "North Central", type: "Private", reg: "PHSRC/PH/259" },
  { name: "Samanala Private Hospital", city: "Nochchiyagama", district: "Anuradhapura", province: "North Central", type: "Private", reg: "PHSRC/PH/233" },
  { name: "My Vision Eye Hospital", city: "Thambuttegama", district: "Anuradhapura", province: "North Central", type: "Private", reg: "PHSRC/PH/296" },

  // Badulla District
  { name: "Central Hospital Badulla", city: "Badulla", district: "Badulla", province: "Uva", type: "Private", reg: "PHSRC/PH/80" },

  // Jaffna District
  { name: "Holy Cross Health Centre", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/95" },
  { name: "New Yarl Hospital", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/144" },
  { name: "Venus Speciality Hospital", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/156" },
  { name: "Northern Central Hospital", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/193" },
  { name: "STS Hospital", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/246" },
  { name: "Mc Leod Hospital", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/243" },
  { name: "Van West Clinic & Nursing Home", city: "Jaffna", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/181" },
  { name: "Green Memorial Hospital", city: "Manipay", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/118" },
  { name: "Evergreen Health Clinic & Nursing Home", city: "Chavakachcheri", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/213" },
  { name: "Ruhbins Hospital", city: "Karaveddy", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/218" },
  { name: "Co-operative Hospital Chulipuram", city: "Chulipuram", district: "Jaffna", province: "Northern", type: "Private", reg: "PHSRC/PH/169" },

  // Vavuniya District
  { name: "Vavuniya Health Care", city: "Vavuniya", district: "Vavuniya", province: "Northern", type: "Private", reg: "PHSRC/PH/281" },
  { name: "Ananthi Health Care", city: "Vavuniya", district: "Vavuniya", province: "Northern", type: "Private", reg: "PHSRC/PH/287" },

  // Kilinochchi District
  { name: "Meena Medical Hospital", city: "Kilinochchi", district: "Kilinochchi", province: "Northern", type: "Private", reg: "PHSRC/PH/285" },

  // Trincomalee District
  { name: "Central Hospital & Maternity Home Trincomalee", city: "Trincomalee", district: "Trincomalee", province: "Eastern", type: "Private", reg: "PHSRC/PH/51" },
  { name: "Dhanvantharii Hospital", city: "Trincomalee", district: "Trincomalee", province: "Eastern", type: "Private", reg: "PHSRC/PH/60" },
  { name: "Hymavathie Hospital", city: "Trincomalee", district: "Trincomalee", province: "Eastern", type: "Private", reg: "PHSRC/PH/272" },

  // Batticaloa District
  { name: "GV Hospital Batticaloa", city: "Batticaloa", district: "Batticaloa", province: "Eastern", type: "Private", reg: "PHSRC/PH/30" },
  { name: "New Pioneer Hospital", city: "Batticaloa", district: "Batticaloa", province: "Eastern", type: "Private", reg: "PHSRC/PH/159" },
  { name: "EMS Hospital", city: "Batticaloa", district: "Batticaloa", province: "Eastern", type: "Private", reg: "PHSRC/PH/275" },
  { name: "Sri Sathya Sai Sanjeevani Hospital", city: "Batticaloa", district: "Batticaloa", province: "Eastern", type: "Private", reg: "PHSRC/PH/290" },
  { name: "Co-op Hospital Eravur", city: "Eravur", district: "Batticaloa", province: "Eastern", type: "Private", reg: "PHSRC/PH/170" },

  // Ampara District
  { name: "Dr. Jameel Memorial Hospital", city: "Kalmunai", district: "Ampara", province: "Eastern", type: "Private", reg: "PHSRC/PH/62" },
  { name: "Medi Land Hospital Kalmunai", city: "Kalmunai", district: "Ampara", province: "Eastern", type: "Private", reg: "PHSRC/PH/113" },
  { name: "Ahmad Ali Hospital", city: "Kalmunai", district: "Ampara", province: "Eastern", type: "Private", reg: "PHSRC/PH/238" },
  { name: "Genius Hospital Akkaraipattu", city: "Akkaraipattu", district: "Ampara", province: "Eastern", type: "Private", reg: "PHSRC/PH/139" },
  { name: "Olivia Hospitals", city: "Akkaraipattu", district: "Ampara", province: "Eastern", type: "Private", reg: "PHSRC/PH/258" },
];

export default SRI_LANKA_HOSPITALS;
