/**
 * Client-side distance-to-coast calculator for UK postcodes.
 *
 * Uses a simplified set of ~300 coastal reference points around Great Britain
 * and Northern Ireland, with Haversine distance to find the nearest coast.
 * Accuracy: approximately +/- 3–8 km — sufficient for BS EN 1991-1-4 wind
 * loading distance-to-sea bands.
 */

/* ---------- Haversine ---------- */

const R_KM = 6371; // Earth mean radius in km
const toRad = (deg) => (deg * Math.PI) / 180;

const haversine = (lat1, lon1, lat2, lon2) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ---------- UK coastline reference points [lat, lon] ---------- */
// Traced clockwise from NE England around GB, then Northern Ireland.

const UK_COAST = [
  // ── England south-east & south coast (E → W) ──
  [51.39, 1.43], // Margate / North Foreland
  [51.35, 1.42], // Broadstairs
  [51.28, 1.40], // Ramsgate
  [51.18, 1.38], // Deal
  [51.13, 1.32], // Dover
  [51.08, 1.22], // Folkestone
  [51.03, 1.07], // Hythe
  [50.92, 0.98], // Dungeness
  [50.91, 0.89], // Camber
  [50.86, 0.75], // Hastings
  [50.84, 0.60], // Bexhill
  [50.83, 0.47], // Eastbourne
  [50.74, 0.25], // Beachy Head
  [50.78, 0.04], // Seaford
  [50.81, -0.13], // Brighton
  [50.83, -0.37], // Worthing
  [50.79, -0.56], // Littlehampton
  [50.79, -0.68], // Bognor Regis
  [50.73, -0.79], // Selsey Bill
  [50.79, -0.95], // Chichester Harbour
  [50.80, -1.09], // Portsmouth
  [50.77, -1.18], // Gosport
  [50.76, -1.30], // Lee-on-Solent
  [50.70, -1.16], // Isle of Wight E (Bembridge)
  [50.58, -1.20], // Isle of Wight SE (Sandown)
  [50.56, -1.30], // Isle of Wight S (Ventnor)
  [50.59, -1.53], // Isle of Wight SW (Brook)
  [50.68, -1.55], // Isle of Wight NW (Yarmouth)
  [50.75, -1.54], // Lymington
  [50.72, -1.71], // Christchurch
  [50.71, -1.88], // Bournemouth
  [50.69, -1.95], // Poole
  [50.64, -2.05], // Swanage
  [50.59, -2.17], // St Alban's Head
  [50.55, -2.34], // Weymouth
  [50.52, -2.46], // Portland Bill
  [50.56, -2.56], // Abbotsbury
  [50.62, -2.73], // Bridport
  [50.71, -2.94], // Lyme Regis
  [50.68, -3.07], // Sidmouth
  [50.63, -3.24], // Exmouth
  [50.55, -3.46], // Dawlish
  [50.47, -3.53], // Torquay
  [50.40, -3.57], // Paignton
  [50.33, -3.56], // Brixham
  [50.26, -3.58], // Dartmouth
  [50.22, -3.64], // Start Point
  [50.23, -3.77], // Salcombe
  [50.28, -3.93], // Bigbury
  [50.33, -4.02], // Yealm
  [50.37, -4.14], // Plymouth
  [50.35, -4.28], // Rame Head
  [50.35, -4.45], // Looe
  [50.34, -4.55], // Polperro
  [50.33, -4.66], // Fowey
  [50.28, -4.77], // Mevagissey
  [50.26, -4.93], // Dodman Point
  [50.22, -5.02], // Gorran Haven
  [50.15, -5.07], // St Mawes
  [50.14, -5.12], // Falmouth
  [50.07, -5.13], // Helford
  [50.04, -5.18], // Coverack
  [49.96, -5.20], // Lizard Point
  [50.04, -5.27], // Mullion
  [50.07, -5.37], // Porthleven
  [50.12, -5.47], // Marazion
  [50.12, -5.53], // Penzance
  [50.07, -5.66], // Sennen
  [50.07, -5.71], // Land's End
  [50.12, -5.70], // St Just
  [50.19, -5.54], // St Ives
  [50.26, -5.44], // Hayle
  [50.27, -5.28], // Portreath
  [50.33, -5.22], // Porthtowan
  [50.36, -5.16], // Perranporth
  [50.42, -5.08], // Newquay
  [50.49, -5.02], // Mawgan Porth
  [50.54, -4.94], // Padstow
  [50.60, -4.85], // Polzeath
  [50.67, -4.76], // Tintagel
  [50.73, -4.68], // Boscastle
  [50.83, -4.55], // Bude
  [50.93, -4.54], // Kilkhampton
  [51.02, -4.53], // Hartland Point

  // ── England/Wales west coast (S → N) ──
  [51.09, -4.35], // Westward Ho!
  [51.12, -4.21], // Braunton
  [51.21, -4.12], // Ilfracombe
  [51.23, -3.83], // Lynmouth
  [51.21, -3.47], // Minehead
  [51.22, -3.28], // Watchet
  [51.24, -3.00], // Burnham-on-Sea
  [51.35, -2.98], // Weston-super-Mare
  [51.44, -2.97], // Clevedon
  [51.49, -2.78], // Portishead
  [51.46, -3.17], // Cardiff
  [51.48, -3.29], // Penarth
  [51.40, -3.41], // Barry
  [51.39, -3.57], // Llantwit Major
  [51.47, -3.78], // Porthcawl
  [51.55, -3.79], // Port Talbot
  [51.62, -3.94], // Swansea
  [51.57, -4.06], // Mumbles
  [51.58, -4.30], // Oxwich
  [51.62, -4.43], // Tenby
  [51.67, -4.70], // Manorbier
  [51.67, -4.94], // Pembroke
  [51.70, -5.04], // Milford Haven
  [51.78, -5.15], // Broad Haven
  [51.88, -5.27], // St Davids Head
  [51.95, -5.19], // Strumble Head
  [52.01, -4.97], // Fishguard
  [52.07, -4.70], // Newport (Pembs)
  [52.13, -4.54], // Cardigan
  [52.19, -4.40], // Aberporth
  [52.28, -4.31], // New Quay
  [52.42, -4.08], // Aberystwyth
  [52.51, -4.05], // Borth
  [52.57, -4.04], // Aberdovey
  [52.64, -4.10], // Tywyn
  [52.73, -4.05], // Barmouth
  [52.81, -4.12], // Harlech
  [52.93, -4.13], // Porthmadog
  [52.95, -4.29], // Pwllheli
  [52.84, -4.51], // Abersoch
  [52.80, -4.71], // Aberdaron
  [52.88, -4.69], // Bardsey Island area
  [53.01, -4.44], // Caernarfon area
  [53.14, -4.27], // Caernarfon
  [53.20, -4.34], // Bangor
  [53.23, -4.42], // Menai Bridge
  [53.32, -4.62], // Holyhead
  [53.42, -4.46], // Amlwch
  [53.38, -4.31], // Anglesey NE
  [53.33, -3.83], // Llandudno
  [53.30, -3.72], // Colwyn Bay
  [53.29, -3.55], // Rhyl
  [53.34, -3.41], // Prestatyn
  [53.35, -3.32], // Point of Ayr
  [53.39, -3.17], // Wirral (W)
  [53.40, -3.06], // Wirral (E)
  [53.45, -3.02], // Liverpool
  [53.53, -3.05], // Crosby
  [53.65, -3.02], // Southport
  [53.73, -3.03], // Lytham St Annes
  [53.82, -3.05], // Blackpool
  [53.90, -3.04], // Fleetwood
  [54.01, -2.84], // Lancaster area
  [54.07, -2.87], // Morecambe
  [54.18, -3.07], // Grange-over-Sands
  [54.11, -3.23], // Barrow-in-Furness
  [54.19, -3.29], // Millom
  [54.29, -3.40], // Ravenglass
  [54.38, -3.50], // Seascale
  [54.51, -3.64], // St Bees Head
  [54.55, -3.59], // Whitehaven
  [54.62, -3.52], // Workington
  [54.71, -3.50], // Maryport
  [54.84, -3.42], // Allonby
  [54.87, -3.39], // Silloth
  [54.92, -3.29], // Bowness-on-Solway
  [54.99, -3.07], // Gretna

  // ── Scotland west coast (S → N) ──
  [54.87, -3.65], // Annan coast
  [54.85, -3.99], // Dalbeattie coast
  [54.84, -4.06], // Kippford
  [54.78, -4.10], // Sandyhills
  [54.84, -4.34], // Kirkcudbright
  [54.78, -4.51], // Gatehouse
  [54.79, -4.70], // Newton Stewart coast
  [54.64, -4.83], // Whithorn
  [54.72, -4.97], // Port William
  [54.83, -5.09], // Stranraer area
  [54.91, -5.03], // Stranraer
  [55.01, -5.09], // Cairnryan
  [55.07, -5.04], // Ballantrae
  [55.18, -4.92], // Girvan
  [55.24, -4.86], // Turnberry
  [55.33, -4.78], // Maidens
  [55.46, -4.63], // Ayr
  [55.54, -4.66], // Troon
  [55.60, -4.74], // Irvine
  [55.64, -4.82], // Ardrossan / Saltcoats
  [55.73, -4.86], // Largs
  [55.83, -4.88], // Wemyss Bay
  [55.96, -4.82], // Gourock
  [55.95, -4.93], // Dunoon
  [55.98, -5.24], // Tighnabruaich
  [55.87, -5.41], // Tarbert (Loch Fyne)
  [55.77, -5.48], // Skipness
  [55.57, -5.59], // Carradale
  [55.43, -5.60], // Campbeltown
  [55.30, -5.75], // Mull of Kintyre
  [56.08, -5.43], // Crinan
  [56.20, -5.46], // Lochgilphead
  [56.27, -5.50], // Oban area
  [56.41, -5.47], // Oban
  [56.52, -5.40], // Lismore
  [56.55, -6.06], // Mull (Tobermory)
  [56.32, -6.37], // Mull (SW)
  [56.45, -6.46], // Coll
  [56.63, -6.23], // Mull N
  [56.69, -5.51], // Ballachulish
  [56.82, -5.11], // Fort William
  [56.87, -5.43], // Strontian
  [56.76, -5.82], // Acharacle
  [56.83, -5.84], // Moidart
  [56.92, -5.84], // Arisaig
  [57.01, -5.83], // Mallaig
  [57.05, -5.92], // Knoydart
  [57.16, -5.89], // Skye S (Armadale)
  [57.30, -6.24], // Skye W (Minginish)
  [57.45, -6.62], // Skye NW (Dunvegan)
  [57.60, -6.36], // Skye N (Uig)
  [57.44, -5.64], // Plockton / Kyle
  [57.50, -5.50], // Strathcarron
  [57.58, -5.52], // Torridon
  [57.67, -5.58], // Shieldaig
  [57.73, -5.69], // Gairloch
  [57.83, -5.57], // Poolewe
  [57.85, -5.38], // Aultbea
  [57.90, -5.16], // Ullapool
  [58.05, -5.24], // Achiltibuie
  [58.15, -5.25], // Lochinver
  [58.22, -5.10], // Stoer
  [58.32, -5.03], // Scourie
  [58.40, -4.99], // Kinlochbervie
  [58.52, -4.96], // Durness area
  [58.56, -5.00], // Cape Wrath area
  [58.63, -5.00], // Cape Wrath

  // ── Scotland north coast (W → E) ──
  [58.55, -4.70], // Durness
  [58.50, -4.42], // Tongue
  [58.52, -4.19], // Bettyhill
  [58.57, -3.78], // Strathy Point
  [58.58, -3.53], // Thurso
  [58.67, -3.37], // Dunnet Head
  [58.64, -3.07], // John o'Groats
  [58.61, -3.22], // Duncansby Head

  // ── Scotland east coast (N → S) ──
  [58.44, -3.09], // Wick
  [58.26, -3.14], // Lybster
  [58.12, -3.65], // Helmsdale
  [58.01, -3.86], // Brora
  [57.97, -3.98], // Golspie
  [57.89, -3.94], // Dornoch
  [57.81, -4.05], // Tain
  [57.69, -4.03], // Invergordon
  [57.59, -4.00], // Cromarty
  [57.50, -4.22], // Inverness Firth
  [57.59, -3.88], // Nairn
  [57.63, -3.61], // Findhorn
  [57.66, -3.43], // Lossiemouth
  [57.68, -3.13], // Buckie
  [57.68, -2.96], // Portsoy
  [57.67, -2.52], // Banff / Macduff
  [57.69, -2.25], // Rosehearty
  [57.69, -2.01], // Fraserburgh
  [57.59, -1.85], // Rattray Head
  [57.50, -1.78], // Peterhead
  [57.41, -1.80], // Cruden Bay
  [57.32, -1.89], // Newburgh
  [57.20, -2.06], // Aberdeen N
  [57.14, -2.08], // Aberdeen
  [57.06, -2.13], // Cove Bay
  [56.96, -2.21], // Stonehaven
  [56.86, -2.27], // Inverbervie
  [56.71, -2.47], // Montrose
  [56.56, -2.58], // Arbroath
  [56.47, -2.70], // Carnoustie
  [56.46, -2.97], // Dundee
  [56.43, -2.83], // Broughty Ferry
  [56.37, -2.79], // Tayport
  [56.34, -2.79], // St Andrews
  [56.28, -2.59], // Fife Ness
  [56.21, -2.64], // Anstruther
  [56.19, -2.82], // Elie
  [56.12, -3.02], // Leven
  [56.07, -3.22], // Kirkcaldy
  [56.03, -3.38], // Burntisland
  [56.00, -3.18], // N Queensferry (Firth of Forth)
  [55.98, -3.19], // Edinburgh (Granton)
  [55.97, -2.96], // Musselburgh
  [55.96, -2.74], // Prestonpans
  [55.97, -2.58], // North Berwick
  [56.00, -2.52], // Dunbar
  [55.90, -2.34], // Cockburnspath
  [55.87, -2.15], // Eyemouth
  [55.77, -2.01], // Berwick-upon-Tweed

  // ── England east coast (N → S) ──
  [55.61, -1.71], // Bamburgh
  [55.53, -1.61], // Seahouses
  [55.42, -1.59], // Alnmouth
  [55.33, -1.59], // Amble
  [55.18, -1.55], // Newbiggin
  [55.13, -1.51], // Blyth
  [55.02, -1.44], // Tynemouth
  [54.97, -1.38], // South Shields
  [54.91, -1.37], // Sunderland
  [54.83, -1.33], // Seaham
  [54.77, -1.22], // Peterlee coast
  [54.69, -1.21], // Hartlepool
  [54.62, -1.14], // Redcar
  [54.56, -1.06], // Saltburn
  [54.49, -0.76], // Staithes
  [54.49, -0.61], // Whitby
  [54.44, -0.47], // Robin Hood's Bay
  [54.38, -0.38], // Ravenscar
  [54.28, -0.40], // Scarborough
  [54.21, -0.32], // Filey
  [54.08, -0.18], // Bridlington
  [53.98, -0.11], // Hornsea
  [53.84, -0.04], // Withernsea
  [53.58, 0.12], // Spurn Head
  [53.57, -0.03], // Cleethorpes
  [53.47, 0.05], // Mablethorpe area
  [53.34, 0.18], // Mablethorpe
  [53.14, 0.34], // Skegness
  [52.97, 0.41], // Gibraltar Point
  [52.94, 0.49], // Hunstanton
  [52.96, 0.68], // Brancaster
  [52.96, 0.89], // Wells-next-the-Sea
  [52.95, 1.06], // Blakeney
  [52.94, 1.16], // Sheringham
  [52.93, 1.30], // Cromer
  [52.85, 1.43], // Mundesley
  [52.73, 1.56], // Happisburgh
  [52.66, 1.66], // Winterton
  [52.57, 1.73], // Great Yarmouth
  [52.47, 1.76], // Lowestoft
  [52.33, 1.68], // Southwold
  [52.25, 1.61], // Dunwich
  [52.15, 1.60], // Aldeburgh
  [52.08, 1.53], // Orford Ness
  [52.01, 1.42], // Woodbridge area
  [51.96, 1.35], // Felixstowe
  [51.88, 1.28], // Harwich
  [51.82, 1.19], // Walton-on-the-Naze
  [51.79, 1.15], // Clacton-on-Sea
  [51.76, 1.05], // Jaywick
  [51.74, 0.90], // Mersea Island
  [51.72, 0.85], // Bradwell
  [51.60, 0.82], // Burnham-on-Crouch
  [51.54, 0.71], // Southend-on-Sea
  [51.47, 0.55], // Canvey Island
  [51.45, 0.35], // Tilbury area
  [51.48, 0.23], // Gravesend / Thames
  [51.50, 0.43], // Isle of Grain
  [51.37, 0.78], // Isle of Sheppey E
  [51.38, 0.90], // Whitstable
  [51.37, 1.08], // Herne Bay
  [51.36, 1.24], // Reculver

  // ── Northern Ireland ──
  [54.10, -6.25], // Warrenpoint
  [54.06, -5.99], // Kilkeel
  [54.21, -5.89], // Newcastle NI
  [54.26, -5.61], // Ardglass
  [54.35, -5.56], // Strangford
  [54.38, -5.55], // Portaferry
  [54.50, -5.51], // Donaghadee
  [54.60, -5.58], // Bangor NI
  [54.67, -5.68], // Holywood
  [54.60, -5.93], // Belfast Lough S
  [54.75, -5.69], // Carrickfergus
  [54.85, -5.81], // Larne
  [54.93, -5.90], // Carnlough
  [55.00, -5.99], // Glenariff
  [55.08, -6.06], // Cushendall
  [55.13, -6.05], // Cushendun
  [55.17, -6.08], // Torr Head
  [55.21, -6.24], // Ballycastle
  [55.23, -6.37], // Carrick-a-Rede
  [55.24, -6.51], // Giant's Causeway
  [55.21, -6.66], // Portrush
  [55.17, -6.77], // Portstewart
  [55.17, -6.77], // Castlerock
  [55.17, -6.94], // Magilligan
  [55.07, -7.15], // Moville area
  [55.04, -7.32], // Derry / Londonderry
];

/* ---------- public API ---------- */

/**
 * Return the approximate straight-line distance (km) from the given
 * coordinates to the nearest UK coastline point.
 *
 * @param {number} lat  Latitude (decimal degrees)
 * @param {number} lon  Longitude (decimal degrees)
 * @returns {number}    Distance in kilometres (rounded to 1 dp)
 */
export const distanceToCoastKm = (lat, lon) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  let min = Infinity;
  for (let i = 0; i < UK_COAST.length; i++) {
    const d = haversine(lat, lon, UK_COAST[i][0], UK_COAST[i][1]);
    if (d < min) min = d;
  }
  return Math.round(min * 10) / 10; // 1 decimal place
};
