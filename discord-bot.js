// ====== Imports ======
const { Client, GatewayIntentBits, REST, Routes, Partials, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, getVoiceConnection, entersState, VoiceConnectionStatus } = require("@discordjs/voice");
const { spawn } = require("child_process");
const { exec } = require("child_process");
const axios = require("axios");
let Jimp = null;
try {
  const jimpPkg = require('jimp');
  // v1.x exports { Jimp, ... }; v0.x exports the class directly
  Jimp = jimpPkg.Jimp ?? jimpPkg;
} catch (_) {}

// ====== Configuration ======
const config = {
  ownerId: "278266066411454474",
  personalityUsers: ["278266066411454474", "697806013377544212", "143458705680105472", "383362076061466627"],
  relayServerId: "1303725085709959239",    // <-- Add Server ID for relay
  allowedGuilds: ["1303725085709959239", "1483471532335304737"],  // whitelisted servers
  relayChannelId: "1412039978057470042", // <-- Add Channel ID for relay
  askWhitelist: [],
  flaggedWords: ["bomb", "kill", "nude", "hack", "virus"],
  randomMessageChannels: [
    "1409584122208456856", // Channel 1
  ],
  storyChannelId: "1412823067528265858",
  emergencyChannelId: "1412039978057470042", // <-- Add channel ID to receive automatic emergency squawk alerts
  rageChannelId: "1412039978057470042", // <-- Channel to announce rage mode
  mapboxToken: process.env.MAPBOX_TOKEN,        // <-- Free token from https://mapbox.com (50,000 requests/month free)
  volantaChannelId: "1412039978057470042",
  volantaUsers: [
    { userId: "c8dce899-5b6b-4534-3fb9-08dca7f6f6ee", username: "Celestial" },
    { userId: "750e3239-b319-402d-902d-7a7723729382", username: "maxpilot95" },
    { userId: "825dfa11-fbd8-4ce4-e5b9-08da9b1a2a09", username: "fsxaviator1" },
    { userId: "89bffd57-ffc9-43e3-aab4-0c13c3a5d0bf", username: "AppleJuice" },
    { userId: "630674b9-8842-42c0-364c-08db0837bdbd", username: "APPLEJU1CE" },
  ],
  vatsimUsers: [
    { cid: "1369606", username: "CF" },
  ],
};

// ====== Aviation Constants ======
const COUNTRY_BBOXES = (() => {
  // [aliases[], name, lamin, lomin, lamax, lomax]
  const raw = [
    [['afghanistan','af'],                           'Afghanistan',                   29.37,  60.52,  38.49,  74.89],
    [['albania','al'],                               'Albania',                       39.62,  19.30,  42.66,  21.06],
    [['algeria','dz'],                               'Algeria',                       18.97,  -8.68,  37.09,  11.99],
    [['andorra','ad'],                               'Andorra',                       42.43,   1.41,  42.66,   1.79],
    [['angola','ao'],                                'Angola',                       -18.02,  11.67,  -4.39,  24.08],
    [['antigua and barbuda','antigua','ag'],          'Antigua and Barbuda',           16.99, -61.91,  17.73, -61.67],
    [['argentina','ar'],                             'Argentina',                    -55.06, -73.58, -21.78, -53.59],
    [['armenia','am'],                               'Armenia',                       38.84,  43.58,  41.30,  46.59],
    [['australia','au'],                             'Australia',                    -43.64, 113.34, -10.67, 153.57],
    [['austria','at'],                               'Austria',                       46.37,   9.53,  49.02,  17.16],
    [['azerbaijan','az'],                            'Azerbaijan',                    38.39,  44.76,  41.92,  50.39],
    [['bahamas','bs'],                               'Bahamas',                       20.91, -79.37,  27.26, -72.71],
    [['bahrain','bh'],                               'Bahrain',                       25.56,  50.35,  26.38,  50.82],
    [['bangladesh','bd'],                            'Bangladesh',                    20.74,  88.01,  26.63,  92.68],
    [['barbados','bb'],                              'Barbados',                      13.05, -59.65,  13.34, -59.42],
    [['belarus','by'],                               'Belarus',                       51.24,  23.18,  56.17,  32.77],
    [['belgium','be'],                               'Belgium',                       49.49,   2.55,  51.50,   6.40],
    [['belize','bz'],                                'Belize',                        15.89, -89.23,  18.50, -87.77],
    [['benin','bj'],                                 'Benin',                          6.22,   0.77,  12.41,   3.84],
    [['bhutan','bt'],                                'Bhutan',                        26.70,  88.75,  28.32,  92.12],
    [['bolivia','bo'],                               'Bolivia',                      -22.90, -69.64,  -9.67, -57.45],
    [['bosnia','bosnia and herzegovina','ba'],        'Bosnia and Herzegovina',        42.56,  15.72,  45.28,  19.62],
    [['botswana','bw'],                              'Botswana',                     -26.91,  19.99, -17.78,  29.38],
    [['brazil','brasil','br'],                       'Brazil',                       -33.77, -73.98,   5.25, -28.85],
    [['brunei','bn'],                                'Brunei',                         4.01, 114.08,   5.07, 115.37],
    [['bulgaria','bg'],                              'Bulgaria',                      41.24,  22.37,  44.23,  28.61],
    [['burkina faso','bf'],                          'Burkina Faso',                   9.40,  -5.52,  15.08,   2.40],
    [['burundi','bi'],                               'Burundi',                       -4.47,  29.02,  -2.31,  30.85],
    [['cambodia','kh'],                              'Cambodia',                      10.41, 102.34,  14.69, 107.63],
    [['cameroon','cm'],                              'Cameroon',                       1.65,   8.49,  13.08,  16.01],
    [['canada','ca'],                                'Canada',                        41.68,-141.00,  83.14, -52.62],
    [['cape verde','cabo verde','cv'],               'Cape Verde',                    14.80, -25.36,  17.20, -22.67],
    [['central african republic','car','cf'],        'Central African Republic',       2.22,  14.42,  11.00,  27.46],
    [['chad','td'],                                  'Chad',                           7.44,  13.47,  23.45,  24.00],
    [['chile','cl'],                                 'Chile',                        -55.89, -75.65, -17.50, -66.41],
    [['china','cn'],                                 'China',                         18.16,  73.67,  53.56, 135.03],
    [['colombia','co'],                              'Colombia',                      -4.23, -81.73,  12.44, -66.87],
    [['comoros','km'],                               'Comoros',                      -12.43,  43.22, -11.35,  44.54],
    [['republic of the congo','congo','cg'],         'Republic of the Congo',         -5.00,  11.20,   3.73,  18.65],
    [['dr congo','democratic republic of the congo','drc','cd'], 'DR Congo',         -13.46,  12.18,   5.34,  31.30],
    [['costa rica','cr'],                            'Costa Rica',                     5.50, -85.96,  11.22, -82.55],
    [['croatia','hr'],                               'Croatia',                       42.39,  13.49,  46.54,  19.44],
    [['cuba','cu'],                                  'Cuba',                          19.83, -84.97,  23.23, -74.14],
    [['cyprus','cy'],                                'Cyprus',                        34.56,  32.27,  35.72,  34.00],
    [['czech republic','czechia','cz'],              'Czech Republic',                48.55,  12.09,  51.06,  18.85],
    [['denmark','dk'],                               'Denmark',                       54.56,   8.07,  57.75,  15.19],
    [['djibouti','dj'],                              'Djibouti',                      10.95,  41.77,  12.71,  43.42],
    [['dominica','dm'],                              'Dominica',                      15.21, -61.48,  15.64, -61.26],
    [['dominican republic','do'],                    'Dominican Republic',            17.47, -71.95,  19.93, -68.32],
    [['ecuador','ec'],                               'Ecuador',                       -5.01, -80.97,   1.67, -75.19],
    [['egypt','eg'],                                 'Egypt',                         22.00,  24.70,  31.67,  36.86],
    [['el salvador','sv'],                           'El Salvador',                   13.15, -90.10,  14.45, -87.71],
    [['equatorial guinea','gq'],                     'Equatorial Guinea',              0.93,   8.44,   3.79,  11.35],
    [['eritrea','er'],                               'Eritrea',                       12.36,  36.43,  18.00,  43.14],
    [['estonia','ee'],                               'Estonia',                       57.52,  21.84,  59.68,  28.21],
    [['eswatini','swaziland','sz'],                  'Eswatini',                     -27.31,  30.79, -25.72,  32.14],
    [['ethiopia','et'],                              'Ethiopia',                       3.42,  32.99,  14.89,  47.98],
    [['fiji','fj'],                                  'Fiji',                         -19.17, 176.89, -15.71, 180.00],
    [['finland','fi'],                               'Finland',                       59.81,  19.51,  70.09,  31.59],
    [['france','fr'],                                'France',                        41.33,  -5.14,  51.12,   9.56],
    [['gabon','ga'],                                 'Gabon',                         -3.98,   8.70,   2.32,  14.50],
    [['gambia','gm'],                                'Gambia',                        13.06, -16.83,  13.83, -13.80],
    [['georgia','ge'],                               'Georgia',                       41.05,  40.00,  43.59,  46.64],
    [['germany','de'],                               'Germany',                       47.27,   5.87,  55.06,  15.04],
    [['ghana','gh'],                                 'Ghana',                          4.74,  -3.26,  11.17,   1.20],
    [['greece','gr'],                                'Greece',                        34.80,  19.37,  41.75,  26.60],
    [['greenland','gl'],                             'Greenland',                     59.74, -73.06,  83.65, -12.21],
    [['grenada','gd'],                               'Grenada',                       11.98, -61.80,  12.53, -61.59],
    [['guatemala','gt'],                             'Guatemala',                     13.74, -92.23,  17.82, -88.22],
    [['guinea','gn'],                                'Guinea',                         7.19, -15.13,  12.67,  -7.63],
    [['guinea-bissau','gw'],                         'Guinea-Bissau',                 10.87, -16.72,  12.68, -13.64],
    [['guyana','gy'],                                'Guyana',                         1.18, -61.40,   8.56, -56.48],
    [['haiti','ht'],                                 'Haiti',                         18.03, -74.47,  20.09, -71.63],
    [['honduras','hn'],                              'Honduras',                      12.98, -89.36,  16.52, -83.14],
    [['hong kong','hk'],                             'Hong Kong',                     22.15, 113.83,  22.56, 114.44],
    [['hungary','hu'],                               'Hungary',                       45.74,  16.11,  48.58,  22.90],
    [['iceland','is'],                               'Iceland',                       63.39, -24.55,  66.55, -13.50],
    [['india','in'],                                 'India',                          8.07,  68.18,  37.10,  97.40],
    [['indonesia','id'],                             'Indonesia',                    -10.36,  95.29,   5.90, 141.02],
    [['iran','ir'],                                  'Iran',                          25.06,  44.04,  39.78,  63.33],
    [['iraq','iq'],                                  'Iraq',                          29.06,  38.79,  37.38,  48.57],
    [['ireland','ie'],                               'Ireland',                       51.44, -10.48,  55.39,  -6.01],
    [['israel','il'],                                'Israel',                        29.50,  34.27,  33.34,  35.90],
    [['italy','it'],                                 'Italy',                         35.49,   6.63,  47.09,  18.52],
    [['ivory coast','cote divoire','ci'],            'Ivory Coast',                    4.34,  -8.60,  10.74,  -2.49],
    [['jamaica','jm'],                               'Jamaica',                       17.70, -78.37,  18.53, -76.19],
    [['japan','jp'],                                 'Japan',                         24.26, 123.00,  45.52, 145.82],
    [['jordan','jo'],                                'Jordan',                        29.18,  34.92,  33.37,  39.30],
    [['kazakhstan','kz'],                            'Kazakhstan',                    40.57,  50.27,  55.45,  87.35],
    [['kenya','ke'],                                 'Kenya',                         -4.67,  33.91,   5.02,  41.90],
    [['kiribati','ki'],                              'Kiribati',                      -4.70, 172.90,   3.40, 177.00],
    [['kosovo','xk'],                                'Kosovo',                        41.86,  20.01,  43.26,  21.79],
    [['kuwait','kw'],                                'Kuwait',                        28.53,  46.56,  30.11,  48.42],
    [['kyrgyzstan','kg'],                            'Kyrgyzstan',                    39.20,  69.26,  43.24,  80.26],
    [['laos','la'],                                  'Laos',                          13.91, 100.09,  22.50, 107.64],
    [['latvia','lv'],                                'Latvia',                        55.67,  20.97,  57.97,  27.89],
    [['lebanon','lb'],                               'Lebanon',                       33.09,  35.10,  34.69,  36.62],
    [['lesotho','ls'],                               'Lesotho',                      -30.65,  27.01, -28.57,  29.46],
    [['liberia','lr'],                               'Liberia',                        4.35, -11.49,   8.55,  -7.37],
    [['libya','ly'],                                 'Libya',                         19.50,   9.39,  33.17,  25.15],
    [['liechtenstein','li'],                         'Liechtenstein',                 47.05,   9.47,  47.27,   9.64],
    [['lithuania','lt'],                             'Lithuania',                     53.90,  20.94,  56.45,  26.84],
    [['luxembourg','lu'],                            'Luxembourg',                    49.44,   5.74,  50.18,   6.53],
    [['madagascar','mg'],                            'Madagascar',                   -25.60,  43.25, -11.95,  50.48],
    [['malawi','mw'],                                'Malawi',                       -17.12,  32.68,  -9.36,  35.77],
    [['malaysia','my'],                              'Malaysia',                       0.77,  99.64,   7.36, 119.28],
    [['maldives','mv'],                              'Maldives',                      -0.73,  72.69,   7.10,  73.75],
    [['mali','ml'],                                  'Mali',                          10.14,  -4.23,  25.00,   4.25],
    [['malta','mt'],                                 'Malta',                         35.79,  14.18,  36.08,  14.57],
    [['marshall islands','mh'],                      'Marshall Islands',               5.59, 160.80,  14.61, 172.00],
    [['mauritania','mr'],                            'Mauritania',                    14.72, -17.06,  27.30,  -4.83],
    [['mauritius','mu'],                             'Mauritius',                    -20.52,  56.51, -10.32,  63.50],
    [['mexico','mx'],                                'Mexico',                        14.55,-117.13,  32.72, -86.71],
    [['micronesia','fm'],                            'Micronesia',                     1.08, 137.52,   9.65, 163.04],
    [['moldova','md'],                               'Moldova',                       45.47,  26.62,  48.49,  30.14],
    [['monaco','mc'],                                'Monaco',                        43.72,   7.38,  43.77,   7.44],
    [['mongolia','mn'],                              'Mongolia',                      41.58,  87.76,  52.15, 119.93],
    [['montenegro','me'],                            'Montenegro',                    41.85,  18.45,  43.52,  20.36],
    [['morocco','ma'],                               'Morocco',                       27.67, -13.17,  35.93,  -0.99],
    [['mozambique','mz'],                            'Mozambique',                   -26.86,  32.38, -10.47,  40.84],
    [['myanmar','burma','mm'],                       'Myanmar',                        9.78,  92.19,  28.54, 101.17],
    [['namibia','na'],                               'Namibia',                      -28.97,  11.72, -16.95,  25.26],
    [['nauru','nr'],                                 'Nauru',                         -0.55, 166.88,  -0.49, 166.96],
    [['nepal','np'],                                 'Nepal',                         26.37,  80.06,  30.42,  88.20],
    [['netherlands','nl','holland'],                 'Netherlands',                   50.75,   3.36,  53.69,   7.23],
    [['new zealand','nz'],                           'New Zealand',                  -46.62, 166.50, -34.45, 178.52],
    [['nicaragua','ni'],                             'Nicaragua',                     10.71, -87.67,  15.02, -83.14],
    [['niger','ne'],                                 'Niger',                         11.69,   0.17,  23.52,  15.90],
    [['nigeria','ng'],                               'Nigeria',                        4.27,   2.69,  13.89,  14.68],
    [['north korea','kp'],                           'North Korea',                   37.67, 124.32,  42.99, 130.69],
    [['north macedonia','macedonia','mk'],            'North Macedonia',               40.85,  20.46,  42.36,  22.99],
    [['norway','no'],                                'Norway',                        57.97,   4.51,  71.19,  31.17],
    [['oman','om'],                                  'Oman',                          16.65,  51.99,  26.40,  59.84],
    [['pakistan','pk'],                              'Pakistan',                      23.69,  60.88,  37.13,  77.83],
    [['palau','pw'],                                 'Palau',                          2.95, 131.13,   8.10, 134.73],
    [['palestine','ps'],                             'Palestine',                     31.22,  34.22,  32.55,  35.57],
    [['panama','pa'],                                'Panama',                         7.21, -83.05,   9.65, -77.18],
    [['papua new guinea','png','pg'],                'Papua New Guinea',             -10.65, 141.00,  -1.31, 155.95],
    [['paraguay','py'],                              'Paraguay',                     -27.59, -62.68, -19.29, -54.26],
    [['peru','pe'],                                  'Peru',                         -18.35, -81.41,  -0.04, -68.68],
    [['philippines','ph'],                           'Philippines',                    5.58, 117.17,  18.76, 126.60],
    [['poland','pl'],                                'Poland',                        49.00,  14.12,  54.84,  24.15],
    [['portugal','pt'],                              'Portugal',                      36.96,  -9.50,  42.15,  -6.19],
    [['puerto rico','pr'],                           'Puerto Rico',                   17.87, -67.28,  18.52, -65.22],
    [['qatar','qa'],                                 'Qatar',                         24.56,  50.75,  26.18,  51.61],
    [['romania','ro'],                               'Romania',                       43.62,  22.09,  48.26,  29.74],
    [['russia','ru','russian federation'],           'Russia',                        41.19,  19.64,  81.96, 180.00],
    [['rwanda','rw'],                                'Rwanda',                        -2.84,  28.86,  -1.05,  30.90],
    [['saint kitts and nevis','saint kitts','st kitts','kn'], 'Saint Kitts and Nevis', 17.09, -62.86, 17.42, -62.54],
    [['saint lucia','st lucia','lc'],                'Saint Lucia',                   13.71, -61.08,  14.11, -60.88],
    [['saint vincent and the grenadines','saint vincent','st vincent','vc'], 'Saint Vincent and the Grenadines', 12.59, -61.46, 13.38, -61.12],
    [['samoa','ws'],                                 'Samoa',                        -14.05,-172.80, -13.41,-171.47],
    [['san marino','sm'],                            'San Marino',                    43.88,  12.40,  44.01,  12.52],
    [['sao tome and principe','stp','st'],           'Sao Tome and Principe',          0.04,   6.46,   1.70,   7.47],
    [['saudi arabia','sa','ksa'],                    'Saudi Arabia',                  16.37,  34.49,  32.15,  55.67],
    [['senegal','sn'],                               'Senegal',                       12.31, -17.53,  16.69, -11.36],
    [['serbia','rs'],                                'Serbia',                        42.23,  18.82,  46.18,  23.01],
    [['seychelles','sc'],                            'Seychelles',                    -9.76,  46.20,  -4.28,  56.29],
    [['sierra leone','sl'],                          'Sierra Leone',                   6.93, -13.30,  10.00, -10.28],
    [['singapore','sg'],                             'Singapore',                      1.15, 103.60,   1.47, 104.09],
    [['slovakia','sk'],                              'Slovakia',                      47.73,  16.83,  49.61,  22.57],
    [['slovenia','si'],                              'Slovenia',                      45.42,  13.38,  46.88,  16.61],
    [['solomon islands','sb'],                       'Solomon Islands',              -11.85, 155.53,  -6.60, 166.97],
    [['somalia','so'],                               'Somalia',                       -1.68,  41.00,  12.02,  51.42],
    [['south africa','za','rsa'],                    'South Africa',                 -34.84,  16.47, -22.12,  32.89],
    [['south korea','korea','kr'],                   'South Korea',                   33.19, 125.07,  38.62, 129.58],
    [['south sudan','ss'],                           'South Sudan',                    3.49,  24.14,  12.24,  35.95],
    [['spain','es'],                                 'Spain',                         35.95,  -9.29,  43.79,   4.28],
    [['sri lanka','lk','ceylon'],                    'Sri Lanka',                      5.92,  79.69,   9.84,  81.89],
    [['sudan','sd'],                                 'Sudan',                          8.67,  21.83,  23.15,  38.61],
    [['suriname','sr'],                              'Suriname',                       1.84, -58.07,   6.01, -53.96],
    [['sweden','se'],                                'Sweden',                        55.34,  10.96,  69.06,  24.17],
    [['switzerland','ch','swiss'],                   'Switzerland',                   45.82,   5.96,  47.81,  10.49],
    [['syria','sy'],                                 'Syria',                         32.31,  35.73,  37.32,  42.38],
    [['taiwan','tw'],                                'Taiwan',                        21.90, 120.01,  25.30, 122.01],
    [['tajikistan','tj'],                            'Tajikistan',                    36.67,  67.36,  41.04,  75.14],
    [['tanzania','tz'],                              'Tanzania',                     -11.74,  29.33,  -0.99,  40.44],
    [['thailand','th'],                              'Thailand',                       5.61,  97.34,  20.47, 105.64],
    [['timor-leste','east timor','tl'],              'Timor-Leste',                   -9.46, 124.04,  -8.13, 127.32],
    [['togo','tg'],                                  'Togo',                           6.10,  -0.15,  11.14,   1.81],
    [['tonga','to'],                                 'Tonga',                        -21.46,-175.35, -15.57,-173.72],
    [['trinidad and tobago','trinidad','tt'],        'Trinidad and Tobago',           10.03, -61.94,  11.37, -60.89],
    [['tunisia','tn'],                               'Tunisia',                       30.24,   7.52,  37.54,  11.59],
    [['turkey','turkiye','tr'],                      'Turkey',                        35.82,  25.66,  42.10,  44.82],
    [['turkmenistan','tm'],                          'Turkmenistan',                  35.14,  52.44,  42.80,  66.69],
    [['tuvalu','tv'],                                'Tuvalu',                        -8.00, 176.07,  -5.68, 179.87],
    [['uganda','ug'],                                'Uganda',                        -1.48,  29.58,   4.22,  35.04],
    [['ukraine','ua'],                               'Ukraine',                       44.39,  22.14,  52.38,  40.21],
    [['uae','united arab emirates','ae','emirates'], 'UAE',                           22.63,  51.58,  26.09,  56.38],
    [['uk','united kingdom','gb','great britain','britain'], 'United Kingdom',        49.89,  -8.62,  60.86,   1.77],
    [['usa','united states','us','america'],         'United States',                 24.00,-125.00,  50.00, -65.00],
    [['uruguay','uy'],                               'Uruguay',                      -34.95, -58.44, -30.12, -53.12],
    [['uzbekistan','uz'],                            'Uzbekistan',                    37.19,  55.99,  45.59,  73.14],
    [['vanuatu','vu'],                               'Vanuatu',                      -20.25, 166.52, -13.07, 170.24],
    [['vatican','vatican city','va'],                'Vatican City',                  41.90,  12.44,  41.91,  12.46],
    [['venezuela','ve'],                             'Venezuela',                      0.72, -73.36,  12.20, -59.80],
    [['vietnam','vn','viet nam'],                    'Vietnam',                        8.56, 102.14,  23.39, 109.46],
    [['yemen','ye'],                                 'Yemen',                         12.11,  42.55,  19.00,  54.52],
    [['zambia','zm'],                                'Zambia',                       -18.07,  21.98,  -8.23,  33.70],
    [['zimbabwe','zw'],                              'Zimbabwe',                     -22.42,  25.24, -15.61,  33.07],
  ];
  const out = {};
  for (const [keys, name, lamin, lomin, lamax, lomax] of raw)
    for (const k of keys) out[k] = { name, lamin, lomin, lamax, lomax };
  return out;
})();

const EMERGENCY_SQUAWKS = {
  '7700': { label: '🚨 GENERAL EMERGENCY', color: 0xff6600 },
  '7600': { label: '📻 RADIO FAILURE', color: 0xffa500 },
  '7500': { label: '🔫 HIJACK', color: 0xff0000 },
};
const knownEmergencies = new Map();
const pendingEmergencies = new Map(); // requires 2 consecutive polls before alerting
const purgeChannelCache = new Map(); // channelId -> lastMessageId at time of last purge

// === GEOGUESSR STATE ===
const geoguessrGames = new Map(); // channelId -> { lat, lng, country, guesses, timeout }

const GEO_SCORES_PATH = path.join(__dirname, 'geoguessr-scores.json');
let geoScores = {}; // userId -> total points
try { geoScores = JSON.parse(fs.readFileSync(GEO_SCORES_PATH, 'utf8')); } catch {}
function saveGeoScores() { fs.writeFileSync(GEO_SCORES_PATH, JSON.stringify(geoScores, null, 2)); }

const GEO_HISTORY_PATH = path.join(__dirname, 'geoguessr-history.json');
let geoHistory = []; // array of {lat, lng} for last 25 used locations
try { geoHistory = JSON.parse(fs.readFileSync(GEO_HISTORY_PATH, 'utf8')); } catch {}
function saveGeoHistory() { fs.writeFileSync(GEO_HISTORY_PATH, JSON.stringify(geoHistory, null, 2)); }

let maintenanceMode = false;

const GOOGLE_USAGE_PATH = path.join(__dirname, 'google-usage.json');
let googleUsage = { month: '', count: 0 };
try { googleUsage = JSON.parse(fs.readFileSync(GOOGLE_USAGE_PATH, 'utf8')); } catch {}
function saveGoogleUsage() { fs.writeFileSync(GOOGLE_USAGE_PATH, JSON.stringify(googleUsage, null, 2)); }
const GOOGLE_MONTHLY_LIMIT = 2000;
let geoDaily = { date: '', count: 0 };
const GEO_DAILY_LIMIT = 70;
const SPASTIC_VOTES_PATH = path.join(__dirname, 'spastic-votes.json');
const SPASTIC_WINS_PATH = path.join(__dirname, 'spastic-wins.json');
let spasticVotes = { date: '', votes: {} };
let spasticWins = {};
try { spasticVotes = JSON.parse(fs.readFileSync(SPASTIC_VOTES_PATH, 'utf8')); } catch {}
try { spasticWins = JSON.parse(fs.readFileSync(SPASTIC_WINS_PATH, 'utf8')); } catch {}
function saveSpasticVotes() { fs.writeFileSync(SPASTIC_VOTES_PATH, JSON.stringify(spasticVotes, null, 2)); }
function saveSpasticWins() { fs.writeFileSync(SPASTIC_WINS_PATH, JSON.stringify(spasticWins, null, 2)); }
function savePermissions() { fs.writeFileSync(PERMISSIONS_PATH, JSON.stringify(permissions, null, 2)); }

const LISTS_PATH = path.join(__dirname, 'lists.json');
let listsData = { lists: {} };
// Migrate from old list.json if needed
try {
  const old = JSON.parse(fs.readFileSync(path.join(__dirname, 'list.json'), 'utf8'));
  if (old && old.items && !fs.existsSync(LISTS_PATH)) {
    listsData.lists['default'] = { title: 'To-Do List', items: old.items, messageId: old.messageId || null, channelId: old.channelId || null };
    fs.writeFileSync(LISTS_PATH, JSON.stringify(listsData, null, 2));
  }
} catch {}
try { listsData = JSON.parse(fs.readFileSync(LISTS_PATH, 'utf8')); } catch {}
function saveLists() { fs.writeFileSync(LISTS_PATH, JSON.stringify(listsData, null, 2)); }

const LIST_STATUSES = {
  not_started:  { label: 'Not Started',  emoji: '⬜' },
  in_progress:  { label: 'In Progress',  emoji: '🟡' },
  investigating:{ label: 'Investigating',emoji: '🔍' },
  finished:     { label: 'Finished',     emoji: '✅' },
};
const STATUS_ORDER = { finished: 0, in_progress: 1, investigating: 2, not_started: 3 };

function sortListItems(items) {
  items.sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));
}

function buildListEmbed(listName) {
  const list = listsData.lists[listName];
  if (!list) return new EmbedBuilder().setTitle('List not found').setColor(0xFF0000);
  const lines = list.items.length === 0
    ? ['*No items yet. Use `/list-add` to add one.*']
    : list.items.map((item, i) => {
        const s = LIST_STATUSES[item.status] || LIST_STATUSES.not_started;
        return (i + 1) + '. ' + s.emoji + ' **' + item.text + '** — ' + s.label;
      });
  return new EmbedBuilder()
    .setTitle(list.title)
    .setDescription(lines.join('\n'))
    .setColor(0x5865F2)
    .setFooter({ text: list.items.length + ' item' + (list.items.length !== 1 ? 's' : '') + ' | Last updated' })
    .setTimestamp();
}

async function refreshListMessage(client, listName) {
  const list = listsData.lists[listName];
  if (!list || !list.messageId || !list.channelId) return;
  try {
    const ch = await client.channels.fetch(list.channelId);
    const msg = await ch.messages.fetch(list.messageId);
    await msg.edit({ embeds: [buildListEmbed(listName)] });
  } catch {
    list.messageId = null;
    list.channelId = null;
    saveLists();
  }
}

function checkGoogleQuota(n = 1) {
  const month = new Date().toISOString().slice(0, 7);
  if (googleUsage.month !== month) googleUsage = { month, count: 0 };
  if (googleUsage.count + n > GOOGLE_MONTHLY_LIMIT) return false;
  googleUsage.count += n;
  saveGoogleUsage();
  return true;
}

const GEO_LOCATIONS = [
  { lat: 48.8566, lng: 2.3522, country: 'France' },
  { lat: 48.2082, lng: 16.3738, country: 'Austria' },
  { lat: 50.8503, lng: 4.3517, country: 'Belgium' },
  { lat: 42.6977, lng: 23.3219, country: 'Bulgaria' },
  { lat: 45.8150, lng: 15.9819, country: 'Croatia' },
  { lat: 50.0755, lng: 14.4378, country: 'Czech Republic' },
  { lat: 55.6761, lng: 12.5683, country: 'Denmark' },
  { lat: 59.4370, lng: 24.7536, country: 'Estonia' },
  { lat: 60.1699, lng: 24.9384, country: 'Finland' },
  { lat: 52.5200, lng: 13.4050, country: 'Germany' },
  { lat: 37.9838, lng: 23.7275, country: 'Greece' },
  { lat: 47.4979, lng: 19.0402, country: 'Hungary' },
  { lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  { lat: 56.9496, lng: 24.1052, country: 'Latvia' },
  { lat: 54.6872, lng: 25.2797, country: 'Lithuania' },
  { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  { lat: 59.9139, lng: 10.7522, country: 'Norway' },
  { lat: 52.2297, lng: 21.0122, country: 'Poland' },
  { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  { lat: 44.4268, lng: 26.1025, country: 'Romania' },
  { lat: 55.7558, lng: 37.6173, country: 'Russia' },
  { lat: 44.8176, lng: 20.4633, country: 'Serbia' },
  { lat: 48.1486, lng: 17.1077, country: 'Slovakia' },
  { lat: 40.4168, lng: -3.7038, country: 'Spain' },
  { lat: 41.3275, lng: 19.8187, country: 'Albania' },
  { lat: 59.3293, lng: 18.0686, country: 'Sweden' },
  { lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
  { lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  { lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  { lat: 53.4808, lng: -2.2426, country: 'United Kingdom' },
  { lat: 55.8642, lng: -4.2518, country: 'United Kingdom' },
  { lat: 40.7128, lng: -74.0060, country: 'USA' },
  { lat: 34.0522, lng: -118.2437, country: 'USA' },
  { lat: 41.8781, lng: -87.6298, country: 'USA' },
  { lat: 29.7604, lng: -95.3698, country: 'USA' },
  { lat: 25.7617, lng: -80.1918, country: 'USA' },
  { lat: 47.6062, lng: -122.3321, country: 'USA' },
  { lat: 39.9526, lng: -75.1652, country: 'USA' },
  { lat: 43.6532, lng: -79.3832, country: 'Canada' },
  { lat: 45.5017, lng: -73.5673, country: 'Canada' },
  { lat: 49.2827, lng: -123.1207, country: 'Canada' },
  { lat: 51.0447, lng: -114.0719, country: 'Canada' },
  { lat: -23.5505, lng: -46.6333, country: 'Brazil' },
  { lat: -22.9068, lng: -43.1729, country: 'Brazil' },
  { lat: -15.7801, lng: -47.9292, country: 'Brazil' },
  { lat: -34.6037, lng: -58.3816, country: 'Argentina' },
  { lat: -33.4489, lng: -70.6693, country: 'Chile' },
  { lat: -12.0464, lng: -77.0428, country: 'Peru' },
  { lat: 4.7110, lng: -74.0721, country: 'Colombia' },
  { lat: 10.4806, lng: -66.9036, country: 'Venezuela' },
  { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  { lat: 20.9674, lng: -89.6237, country: 'Mexico' },
  { lat: 9.1021, lng: -79.4023, country: 'Panama' },
  { lat: 18.4861, lng: -69.9312, country: 'Dominican Republic' },
  { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { lat: 34.6937, lng: 135.5023, country: 'Japan' },
  { lat: 43.0618, lng: 141.3545, country: 'Japan' },
  { lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  { lat: 39.9042, lng: 116.4074, country: 'China' },
  { lat: 31.2304, lng: 121.4737, country: 'China' },
  { lat: 23.1291, lng: 113.2644, country: 'China' },
  { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  { lat: 18.7961, lng: 98.9647, country: 'Thailand' },
  { lat: 21.0278, lng: 105.8342, country: 'Vietnam' },
  { lat: 10.8231, lng: 106.6297, country: 'Vietnam' },
  { lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
  { lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  { lat: 19.0760, lng: 72.8777, country: 'India' },
  { lat: 13.0827, lng: 80.2707, country: 'India' },
  { lat: 12.9716, lng: 77.5946, country: 'India' },
  { lat: 23.7275, lng: 90.4125, country: 'Bangladesh' },
  { lat: 27.7172, lng: 85.3240, country: 'Nepal' },
  { lat: 41.2995, lng: 69.2401, country: 'Uzbekistan' },
  { lat: 51.1801, lng: 71.4460, country: 'Kazakhstan' },
  { lat: 42.8746, lng: 74.5698, country: 'Kyrgyzstan' },
  { lat: 25.2048, lng: 55.2708, country: 'UAE' },
  { lat: 24.6877, lng: 46.7219, country: 'Saudi Arabia' },
  { lat: 31.7683, lng: 35.2137, country: 'Israel' },
  { lat: 32.0853, lng: 34.7818, country: 'Israel' },
  { lat: 33.8869, lng: 35.5131, country: 'Lebanon' },
  { lat: 39.9208, lng: 32.8541, country: 'Turkey' },
  { lat: 29.3759, lng: 47.9774, country: 'Kuwait' },
  { lat: 25.2854, lng: 51.5310, country: 'Qatar' },
  { lat: -33.9249, lng: 18.4241, country: 'South Africa' },
  { lat: -26.2041, lng: 28.0473, country: 'South Africa' },
  { lat: -29.8587, lng: 31.0218, country: 'South Africa' },
  { lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  { lat: -1.2921, lng: 36.8219, country: 'Kenya' },
  { lat: -4.0435, lng: 39.6682, country: 'Kenya' },
  { lat: 5.6037, lng: -0.1870, country: 'Ghana' },
  { lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
  { lat: 14.7167, lng: -17.4677, country: 'Senegal' },
  { lat: -25.9692, lng: 32.5732, country: 'Mozambique' },
  { lat: -33.8688, lng: 151.2093, country: 'Australia' },
  { lat: -37.8136, lng: 144.9631, country: 'Australia' },
  { lat: -27.4698, lng: 153.0251, country: 'Australia' },
  { lat: -31.9505, lng: 115.8605, country: 'Australia' },
  { lat: -36.8485, lng: 174.7633, country: 'New Zealand' },
  { lat: -41.2865, lng: 174.7762, country: 'New Zealand' },
  { lat: -43.5321, lng: 172.6362, country: 'New Zealand' },
];


function loadPurgeCache() {
  try {
    if (fs.existsSync(PURGE_CACHE_PATH)) {
      const obj = JSON.parse(fs.readFileSync(PURGE_CACHE_PATH, 'utf8'));
      for (const [k, v] of Object.entries(obj)) purgeChannelCache.set(k, v);
    }
  } catch {}
}

function savePurgeCache() {
  const obj = {};
  purgeChannelCache.forEach((v, k) => { obj[k] = v; });
  try { fs.writeFileSync(PURGE_CACHE_PATH, JSON.stringify(obj)); } catch {}
}

loadPurgeCache();
let rouletteTimeoutActive = false; // suppresses auto-remove when roulette times out the owner
const safeStreaks = new Map(); // tracks consecutive SAFE outcomes per user
let autoRemoveTimeoutEnabled = false; // toggled via /toggleprotection

// ====== Constants & Initial Setup ======
const restartFile = "./restart_channel.txt";
const token = fs
  .readFileSync(path.join(__dirname, "discord-token.config"), "utf8")
  .split("=")[1]
  .trim();

const messages = fs
  .readFileSync("messages.txt", "utf-8")
  .replace(/\r/g, '')
  .split("\n")
  .filter(Boolean);

const messagesB = fs
  .readFileSync("messagesB.txt", "utf-8")
  .replace(/\r/g, '')
  .split("\n")
  .filter(Boolean);

const SETTINGS_PATH = path.join(__dirname, "tts-settings.json");
const PERMISSIONS_PATH = path.join(__dirname, 'permissions.json');
const PERSONALITY_PATH = path.join(__dirname, 'personality.json');
const TRIVIA_SCORES_PATH = path.join(__dirname, 'trivia_scores.json');
const MESSAGE_COUNTS_PATH = path.join(__dirname, 'message_counts.json');
const ROULETTE_STREAKS_PATH = path.join(__dirname, 'roulette_streaks.json');
const PURGE_CACHE_PATH = path.join(__dirname, 'purge_cache.json');
const VOLANTA_LAST_FLIGHT_PATH = path.join(__dirname, 'volanta_last_flight.json');
const KNOWN_EMERGENCIES_PATH = path.join(__dirname, 'known_emergencies.json');
const DEFAULT_STORY_LENGTH = 15;

// ====== Permissions and Settings Functions ======
let settings = {};
let permissions = {};
let personality = null;
let triviaScores = {};
let messageCounts = {};
const rouletteCooldowns = new Map();
const rouletteStreaks = new Map(); // userId -> { count, lastMutedAt }
let rageModeActive = false;
let emergencyFirstPoll = true;
const lastVolantaFlightIds = new Map(); // userId -> last seen flight ID
const MUTE_DURATIONS_MS = [1, 5, 10, 30, 60, 120, 240].map(m => m * 60 * 1000); // 1m 5m 10m 30m 1h 2h 4h
const triviaCooldowns = new Map();
const geminiUserCooldowns = new Map();

// ====== Gemini Rate Limiter ======
// Free tier: 15 RPM. We cap at 12 to stay safe.
const GEMINI_RPM_LIMIT = 12;
const GEMINI_USER_COOLDOWN_MS = 45 * 1000; // 45s per-user cooldown
const geminiRequestTimes = [];

function checkGeminiRateLimit(userId) {
  const now = Date.now();

  // Per-user cooldown
  const lastUsed = geminiUserCooldowns.get(userId) || 0;
  const userRemaining = GEMINI_USER_COOLDOWN_MS - (now - lastUsed);
  if (userRemaining > 0) {
    return { allowed: false, reason: `You're on cooldown. Try again in **${Math.ceil(userRemaining / 1000)}s**.` };
  }

  // Global RPM check
  const oneMinuteAgo = now - 60 * 1000;
  while (geminiRequestTimes.length > 0 && geminiRequestTimes[0] < oneMinuteAgo) {
    geminiRequestTimes.shift();
  }
  if (geminiRequestTimes.length >= GEMINI_RPM_LIMIT) {
    const oldestRequest = geminiRequestTimes[0];
    const resetIn = Math.ceil((oldestRequest + 60 * 1000 - now) / 1000);
    return { allowed: false, reason: `The AI is being heavily used right now. Try again in **${resetIn}s**.` };
  }

  geminiRequestTimes.push(now);
  geminiUserCooldowns.set(userId, now);
  return { allowed: true };
}

function loadPermissions() {
    try {
        if (fs.existsSync(PERMISSIONS_PATH)) {
            permissions = JSON.parse(fs.readFileSync(PERMISSIONS_PATH, "utf8"));
            if (!permissions.features) permissions.features = {};
            if (!permissions.features.ask) permissions.features.ask = { enabled: true, restrictedUsers: [] };
            if (!permissions.features.story) permissions.features.story = { enabled: true, restrictedUsers: [] };
            const _featureDefaults = ['spastic','trivia','8ball','roulette','geoguessr','mood','gpsjam','radar','random_messages'];
            for (const f of _featureDefaults) { if (!permissions.features[f]) permissions.features[f] = { enabled: true }; }
            if (!permissions.globalBlacklist) permissions.globalBlacklist = [];
        } else {
            console.error("permissions.json not found! Using defaults.");
            permissions = {
                globalBlacklist: [],
                features: {
                    story: { enabled: true, restrictedUsers: [] },
                    ask: { enabled: true, restrictedUsers: [] }
                }
            };
        }
    } catch (error) {
        console.error("Fatal error loading permissions.json:", error);
        permissions = { globalBlacklist: [], features: { story: { restrictedUsers: [] }, ask: { restrictedUsers: [] } } };
    }
}

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
    } else {
      settings = {};
    }
  } catch (error) {
    console.error("Failed to read settings:", error);
    settings = {};
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

function setGuildSettings(guildId, newSettings) {
  if (!settings[guildId]) {
    settings[guildId] = { storyLength: DEFAULT_STORY_LENGTH };
  }
  Object.assign(settings[guildId], newSettings);
  saveSettings();
}

function getGuildSettings(guildId) {
  if (!settings[guildId]) {
    settings[guildId] = { storyLength: DEFAULT_STORY_LENGTH };
    saveSettings();
  }
  if (settings[guildId].storyLength === undefined) settings[guildId].storyLength = DEFAULT_STORY_LENGTH;
  return settings[guildId];
}

// ====== Client ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

// ===== Random Server-Wide Messages =====
async function sendRandomMessageToSpecificChannel(guild) {
  if (!isFeatureEnabled("random_messages")) return;
  const channels = guild.channels.cache.filter(
    (channel) => config.randomMessageChannels.includes(channel.id) && channel.isTextBased()
  );
  if (!channels.size) return;
  const randomChannel = channels.random();
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  randomChannel.send(randomMessage).catch(console.error);
}

function scheduleRandomMessage(guild) {
  const min = 1 * 60 * 60 * 1000;
  const max = 12 * 60 * 60 * 1000;
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  setTimeout(async () => {
    await sendRandomMessageToSpecificChannel(guild);
    scheduleRandomMessage(guild);
  }, delay);
}

// ====== Islamic Prayer Time Scheduler ======
const ADHAN_PATH = path.join(__dirname, 'adhan.mp3');
const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

async function schedulePrayerTimes(client) {
  try {
    const res = await axios.get('https://api.aladhan.com/v1/timingsByCity?city=London&country=UK&method=2', { timeout: 10000 });
    const timings = res.data?.data?.timings;
    if (!timings) throw new Error('No timings in response');

    const now = new Date();
    for (const prayer of PRAYER_NAMES) {
      const [h, m] = timings[prayer].split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(h, m, 0, 0);
      const delay = prayerTime - now;
      if (delay > 0) {
        setTimeout(() => playAdhan(client, prayer), delay);
        console.log(`Adhan scheduled for ${prayer} at ${timings[prayer]}`);
      }
    }

    // Reschedule for tomorrow at midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0);
    setTimeout(() => schedulePrayerTimes(client), tomorrow - now);
    console.log('Prayer times loaded for today.');
  } catch (e) {
    console.error('Prayer scheduler error:', e.message);
    // Retry in 1 hour if something went wrong
    setTimeout(() => schedulePrayerTimes(client), 60 * 60 * 1000);
  }
}

async function playAdhan(client, prayerName) {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return;

    const voiceChannel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildVoice && ch.members.size > 0);
    if (!voiceChannel) {
      console.log(`Adhan: no occupied voice channels for ${prayerName}`);
      return;
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch (e) {
      console.error('Adhan voice connection failed:', e.message);
      connection.destroy();
      return;
    }

    const player = createAudioPlayer();
    const ffmpegProc = spawn('ffmpeg', ['-i', ADHAN_PATH, '-f', 's16le', '-ar', '48000', '-ac', '2', 'pipe:1'], { stdio: ['ignore', 'pipe', 'pipe'] });
    ffmpegProc.stderr.on('data', d => console.log('ffmpeg stderr:', d.toString().slice(-100)));
    const resource = createAudioResource(ffmpegProc.stdout, { inputType: StreamType.Raw });
    connection.subscribe(player);
    player.play(resource);

    player.on(AudioPlayerStatus.Playing, () => console.log(`Adhan now playing for ${prayerName}`));
    player.on(AudioPlayerStatus.Buffering, () => console.log('Adhan buffering...'));
    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
      console.log(`Adhan finished for ${prayerName}`);
    });

    player.on('error', err => {
      console.error('Adhan player error:', err.message);
      connection.destroy();
    });

    console.log(`Playing adhan for ${prayerName} in ${voiceChannel.name}`);
  } catch (e) {
    console.error('Adhan playback error:', e.message);
  }
}

function scheduleRageMode(client) {
  // Fires at a completely random point within the next 12 hours
  const delay = Math.floor(Math.random() * 8 * 60 * 60 * 1000);
  const warningDelay = Math.max(0, delay - 5 * 60 * 1000);

  // 5-minute warning
  setTimeout(async () => {
    try {
      const guild = client.guilds.cache.first();
      const channel = guild?.channels.cache.get(config.rageChannelId);
      if (channel) {
        const rageTs = Math.floor((Date.now() + Math.min(delay - warningDelay, 5 * 60 * 1000)) / 1000);
        await channel.send(`⚠️ **RAGE MODE IS COMING** — roulette will go into rage mode <t:${rageTs}:R>. Get ready!`);
      }
    } catch {}
  }, warningDelay);

  setTimeout(async () => {
    rageModeActive = true;
    // Announce in the rage channel
    try {
      const guild = client.guilds.cache.first();
      if (guild && config.rageChannelId) {
        const channel = guild.channels.cache.get(config.rageChannelId);
        if (channel) {
          await channel.send(
            '🔴🔴🔴 **RAGE MODE ACTIVATED!** 🔴🔴🔴\n' +
            'All `/roulette` cooldowns are **removed** and there is **NO SAFE** outcome for the next **30 seconds!**\n' +
            'Every spin WILL hit someone. GO!'
          );
        }
      }
    } catch (e) { console.error('Rage mode announce failed:', e.message); }

    // Deactivate after 30 seconds, then schedule the next one
    setTimeout(async () => {
      rageModeActive = false;
      try {
        const guild = client.guilds.cache.first();
        if (guild && config.rageChannelId) {
          const channel = guild.channels.cache.get(config.rageChannelId);
          if (channel) await channel.send('🟢 **Rage mode over.** Normal roulette rules restored.');
        }
      } catch (e) { console.error('Rage mode end announce failed:', e.message); }
      scheduleRageMode(client);
    }, 30 * 1000);
  }, delay);
}

function loadPersonality() {
  try {
    if (fs.existsSync(PERSONALITY_PATH)) {
      const data = JSON.parse(fs.readFileSync(PERSONALITY_PATH, "utf8"));
      personality = data.personality || null;
    }
  } catch (error) {
    console.error("Failed to load personality:", error);
  }
}

function savePersonality() {
  try {
    fs.writeFileSync(PERSONALITY_PATH, JSON.stringify({ personality }, null, 2));
  } catch (error) {
    console.error("Failed to save personality:", error);
  }
}

function loadRouletteStreaks() {
  try {
    if (fs.existsSync(ROULETTE_STREAKS_PATH)) {
      const data = JSON.parse(fs.readFileSync(ROULETTE_STREAKS_PATH, "utf8"));
      if (data.streaks) {
        rouletteStreaks.clear();
        Object.entries(data.streaks).forEach(([key, value]) => {
          rouletteStreaks.set(key, value);
        });
      }
    }
  } catch (error) {
    console.error("Failed to load roulette streaks:", error);
  }
}

function saveRouletteStreaks() {
  try {
    const streaksObj = {};
    rouletteStreaks.forEach((value, key) => {
      streaksObj[key] = value;
    });
    fs.writeFileSync(ROULETTE_STREAKS_PATH, JSON.stringify({ streaks: streaksObj }, null, 2));
  } catch (error) {
    console.error("Failed to save roulette streaks:", error);
  }
}

function loadKnownEmergencies() {
  try {
    if (fs.existsSync(KNOWN_EMERGENCIES_PATH)) {
      const data = JSON.parse(fs.readFileSync(KNOWN_EMERGENCIES_PATH, 'utf8'));
      knownEmergencies.clear();
      Object.entries(data).forEach(([icao24, entry]) => {
        knownEmergencies.set(icao24, entry);
      });
    }
  } catch (e) { console.error('Failed to load known emergencies:', e); }
}

function saveKnownEmergencies() {
  try {
    const obj = {};
    knownEmergencies.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(KNOWN_EMERGENCIES_PATH, JSON.stringify(obj, null, 2));
  } catch (e) { console.error('Failed to save known emergencies:', e); }
}

function loadTriviaScores() {
  try {
    if (fs.existsSync(TRIVIA_SCORES_PATH)) {
      triviaScores = JSON.parse(fs.readFileSync(TRIVIA_SCORES_PATH, "utf8"));
    }
  } catch (error) {
    console.error("Failed to load trivia scores:", error);
  }
}

function saveTriviaScores() {
  try {
    fs.writeFileSync(TRIVIA_SCORES_PATH, JSON.stringify(triviaScores, null, 2));
  } catch (error) {
    console.error("Failed to save trivia scores:", error);
  }
}

function loadMessageCounts() {
  try {
    if (fs.existsSync(MESSAGE_COUNTS_PATH)) {
      messageCounts = JSON.parse(fs.readFileSync(MESSAGE_COUNTS_PATH, "utf8"));
    }
  } catch (error) {
    console.error("Failed to load message counts:", error);
  }
}

function saveMessageCounts() {
  try {
    fs.writeFileSync(MESSAGE_COUNTS_PATH, JSON.stringify(messageCounts, null, 2));
  } catch (error) {
    console.error("Failed to save message counts:", error);
  }
}

function awardTriviaPoint(userId, username) {
  if (!triviaScores[userId]) triviaScores[userId] = { username, points: 0 };
  triviaScores[userId].points++;
  triviaScores[userId].username = username;
  saveTriviaScores();
}

readSettings();
loadPermissions();
loadPersonality();
loadTriviaScores();
loadMessageCounts();
loadRouletteStreaks();
loadKnownEmergencies();
try { if (fs.existsSync(VOLANTA_LAST_FLIGHT_PATH)) { const saved = JSON.parse(fs.readFileSync(VOLANTA_LAST_FLIGHT_PATH)); for (const [k, v] of Object.entries(saved)) lastVolantaFlightIds.set(k, v); } } catch(e) {}

// ====== Ready / Command Registration ======
client.once("ready", async () => {
  console.log("Bot is ready!");

  const commands = [
    {
      name: "purge",
      description: "Delete messages from the bot or yourself.",
      options: [{
        name: "target",
        description: "Whose messages to delete",
        type: 3,
        required: true,
        choices: [
          { name: "Bot messages", value: "bot" },
          { name: "My messages", value: "mine" },
        ],
      }],
    },
    { name: "maintenance", description: "Toggle maintenance mode" },
    { name: "quickpurge", description: "Quickly delete recent bot messages (last 100 msgs per channel)." },
    {
      name: "scout",
      description: "Diagnostic location probe",
      options: [{ name: "query", description: "Location identifier", type: 3, required: true }]
    },
    {
      name: "geoguessr",
      description: "Play GeoGuessr — guess where the street view is!",
      options: [
        { name: "start", description: "Start a new round", type: 1 },
        {
          name: "guess",
          description: "Submit your location guess",
          type: 1,
          options: [{ name: "location", description: "Your guess (city, country, etc.)", type: 3, required: true }]
        },
        { name: "reveal", description: "Reveal the answer early (owner only)", type: 1 },
        { name: "leaderboard", description: "Show the all-time server leaderboard", type: 1 }
      ]
    },
    {
      name: "spastic",
      description: "Vote for Spastic of the Day",
      options: [
        {
          name: "vote",
          description: "Nominate today's Spastic of the Day",
          type: 1,
          options: [
            { name: "user", description: "Who do you nominate?", type: 6, required: true },
            { name: "reason", description: "Why are they the spastic? (anonymous)", type: 3, required: false }
          ]
        },
        { name: "leaderboard", description: "All-time Spastic of the Day wins", type: 1 }
      ]
    },
    { name: "status", description: "Shows the current server status" },
    {
      name: "feature",
      description: "Enable or disable bot features (owner only)",
      options: [
        {
          name: "toggle",
          description: "Toggle a feature on or off",
          type: 1,
          options: [{ name: "name", description: "Feature to toggle", type: 3, required: true, choices: [
            { name: "Ask (AI questions)", value: "ask" },
            { name: "Story", value: "story" },
            { name: "Spastic of the Day", value: "spastic" },
            { name: "Trivia", value: "trivia" },
            { name: "8 Ball", value: "8ball" },
            { name: "Roulette", value: "roulette" },
            { name: "GeoGuessr", value: "geoguessr" },
            { name: "Mood Analysis", value: "mood" },
            { name: "GPS Jam", value: "gpsjam" },
            { name: "Radar", value: "radar" },
            { name: "Random Messages", value: "random_messages" },
          ]}]
        },
        { name: "list", description: "Show the status of all features", type: 1 }
      ]
    },
    { name: "help", description: "Lists all available commands" },
    { name: "josep", description: "Make the fat Greek speak" },
    { name: "david", description: "Make retard speak" },
    { name: "log", description: "Big batty gyal good evening" },
    { name: "clearlog", description: "You look like your chicken need seasoning" },
    { name: "toggleprotection", description: "Toggle the auto-remove timeout protection on or off." },
    { name: "adhan", description: "..." },
    {
      name: "unmute",
      description: "Unmutes a specific user in your voice channel.",
      options: [{ name: "user", description: "The user to unmute.", type: 6, required: true }],
    },
    {
        name: "removetimeout",
        description: "Removes the timeout from a user.",
        options: [{ name: "user", description: "The user to remove timeout from.", type: 6, required: true }],
    },
    {
      name: "sepsearch",
      description: "Search the messages file",
      options: [{ name: "query", description: "Text to search for", type: 3, required: true }],
    },
    {
      name: "setstorylength",
      description: "Set the number of lines required before a story is posted",
      options: [{ name: "lines", description: "Number of lines", type: 4, required: true, min_value: 5, max_value: 50 }],
    },
    {
      name: "ask",
      description: "Ask the AI a question.",
      options: [{
        name: "question",
        description: "The question you want to ask.",
        type: 3,
        required: true,
      }],
    },
    {
      name: "setpersonality",
      description: "Set a custom personality for the AI.",
      options: [{
        name: "description",
        description: "Describe the personality (e.g. 'a grumpy pirate who hates everything')",
        type: 3,
        required: true,
      }],
    },
    { name: "clearpersonality", description: "Reset the AI back to its default personality." },
    { name: "personality", description: "Show the current AI personality." },
    {
      name: "8ball",
      description: "Ask the Magic 8 Ball a question.",
      options: [
        {
          name: "question",
          description: "The question you want to ask.",
          type: 3, // STRING
          required: true,
        },
      ],
    },
    { name: "trivia", description: "Start a trivia question. First to answer correctly wins a point!" },
    { name: "triviascores", description: "Show the trivia leaderboard." },
    { name: "roulette", description: "Spin the chamber. 50/50 chance someone gets timed out for 60 seconds." },
    { name: "mostactive", description: "Show the most active chatters in the server." },
    { name: "mood", description: "Analyse the current mood of the server based on recent messages." },
    {
      name: "fbi",
      description: "Pull a random FBI Most Wanted person, or search for someone.",
      options: [{ name: "search", description: "Search by name or crime", type: 3, required: false }],
    },
    { name: "gpsjam", description: "Show a live global GPS jamming and interference map." },
    {
      name: "usermood",
      description: "Analyse the current mood of a specific user based on their recent messages.",
      options: [{ name: "user", description: "The user to analyse", type: 6, required: true }],
    },
    { name: "josephmood", description: "Psychoanalyse Joseph based on his greatest hits." },
    {
      name: "radar",
      description: "Live air traffic summary over a country.",
      options: [{ name: "country", description: "Country name or code (e.g. UK, France, USA)", type: 3, required: true }],
    },
    {
      name: "metar",
      description: "Fetch the latest METAR for an airport.",
      options: [{ name: "icao", description: "The ICAO airport code (e.g. EGLL, KJFK)", type: 3, required: true }],
    },
    { name: "whosflying", description: "Check if anyone is currently flying in MSFS on Volanta." },
    {
      name: 'list',
      description: 'Post or refresh a to-do list in this channel.',
      options: [{ name: 'name', description: 'List name (e.g. "default")', type: 3, required: true }],
    },
    {
      name: 'list-create',
      description: 'Create a new to-do list.',
      options: [
        { name: 'name', description: 'List identifier (no spaces)', type: 3, required: true },
        { name: 'title', description: 'Display title for the list', type: 3, required: true },
      ],
    },
    {
      name: 'list-add',
      description: 'Add an item to a to-do list.',
      options: [
        { name: 'name', description: 'List name', type: 3, required: true },
        { name: 'item', description: 'The item to add', type: 3, required: true },
      ],
    },
    {
      name: 'list-remove',
      description: 'Remove an item from a to-do list by number.',
      options: [
        { name: 'name', description: 'List name', type: 3, required: true },
        { name: 'number', description: 'Item number to remove', type: 4, required: true, min_value: 1 },
      ],
    },
    {
      name: 'list-status',
      description: 'Update the status of a to-do list item.',
      options: [
        { name: 'name', description: 'List name', type: 3, required: true },
        { name: 'number', description: 'Item number', type: 4, required: true, min_value: 1 },
        { name: 'status', description: 'New status', type: 3, required: true, choices: [
          { name: 'Not Started',   value: 'not_started'   },
          { name: 'In Progress',   value: 'in_progress'   },
          { name: 'Investigating', value: 'investigating' },
          { name: 'Finished',      value: 'finished'      },
        ]},
      ],
    },
  ];

  client.guilds.cache.forEach(guild => {
    scheduleRandomMessage(guild);
  });

  // Start rage mode scheduler
  scheduleRageMode(client);
  console.log("Rage mode scheduler started.");

  // Schedule daily auto-purge at 4:30am UTC
  scheduleAutoPurge(client);

  // Start Volanta flight poller
  if (config.volantaUsers?.length && config.volantaChannelId) {
    setInterval(() => pollVolantaFlights(client), 5 * 60 * 1000);
    console.log('Volanta flight poller started.');
  }

  // Start emergency squawk polling (disabled - re-enable by removing `false &&`)
  if (false && config.emergencyChannelId) {
    setInterval(() => pollEmergencies(client), 5 * 60 * 1000);
    console.log("Emergency squawk polling started.");
  }

  // Start Islamic prayer time Adhan scheduler
  schedulePrayerTimes(client);
  scheduleSpasticResults(client);

  const rest = new REST({ version: "10" }).setToken(token);
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Error registering commands:", error);
  }

  if (fs.existsSync(restartFile)) {
    try {
      const { userId, channelId } = JSON.parse(fs.readFileSync(restartFile, "utf8"));
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        await channel.send({ content: `<@${userId}>, bot restarted successfully!`, ephemeral: true });
      }
    } catch (error) {
      console.warn("Failed to send restart confirmation message:", error);
    }
    fs.unlinkSync(restartFile);
  }
});

// ====== Helper Functions ======
function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

const executeCommand = async (interaction, command, successMessage) => {
  exec(command, async (err, stdout, stderr) => {
    if (err || stderr) {
      console.error(`Error executing command '${command}':`, err || stderr);
      return interaction.reply({ content: `Failed to execute command: ${command}`, ephemeral: true });
    }
    await interaction.reply({ content: successMessage, ephemeral: true });
  });
};

function isFeatureEnabled(name) {
  return permissions.features?.[name]?.enabled !== false;
}

const hasPermission = (interaction, userId) => {
  if (interaction.user.id !== userId) {
    interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
    return false;
  }
  return true;
};

// ====== Interaction Handling ======
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.user.id !== config.ownerId) {
    const logMessage = `Command: /${interaction.commandName} executed by ${interaction.user.tag} (${interaction.user.id}) at ${new Date().toISOString()}\n`;
    fs.appendFileSync("command_log.txt", logMessage);
  }

  if (!config.allowedGuilds.includes(interaction.guildId)) {
    return interaction.reply({ content: 'This bot is not available in this server.', ephemeral: true });
  }

  if (maintenanceMode && interaction.user.id !== config.ownerId) {
    return interaction.reply({ content: '🔧 The bot is currently under maintenance. Please try again later.', ephemeral: true });
  }

  switch (interaction.commandName) {
    case "feature": return handleFeature(interaction);
    case "help": {
      const helpPages = [
        {
          title: "📋 General Commands",
          fields: [
            { name: "/help", value: "Lists all available commands", inline: false },
            { name: "/status", value: "Show the current server status", inline: false },
            { name: "/purge", value: "Delete all bot messages", inline: false },
            { name: "/log", value: "View the command log", inline: false },
            { name: "/clearlog", value: "Clear the command log", inline: false },
          ],
        },
        {
          title: "🎭 Fun Commands",
          fields: [
            { name: "/josep", value: "Make the fat Greek speak", inline: false },
            { name: "/david", value: "Make retard speak", inline: false },
            { name: "/trivia", value: "Start a trivia question — first to answer wins a point!", inline: false },
            { name: "/triviascores", value: "Show the trivia leaderboard", inline: false },
            { name: "/roulette", value: "Spin the chamber — 50/50 chance someone gets timed out for 60s (RAGE MODE: no cooldowns, no safe slot!)", inline: false },
            { name: "/8ball <question>", value: "Ask the magic 8 ball a question", inline: false },
            { name: "/fbi [search]", value: "Get a random FBI Most Wanted person (optional: search by name or crime)", inline: false },
          ],
        },
        {
          title: "🤖 AI Commands",
          fields: [
            { name: "/ask <question>", value: "Ask the AI a question", inline: false },
            { name: "/setpersonality <description>", value: "Give the AI a custom personality", inline: false },
            { name: "/clearpersonality", value: "Reset the AI back to its default personality", inline: false },
            { name: "/personality", value: "Show the current AI personality", inline: false },
            { name: "/mood", value: "Analyse the current mood of the server based on recent messages", inline: false },
            { name: "/usermood <user>", value: "Analyse a specific user's mood", inline: false },
            { name: "/josephmood", value: "Psychoanalyse Joseph based on his greatest hits", inline: false },
          ],
        },
        {
          title: "🛠️ Moderation & Utility",
          fields: [
            { name: "/unmute <user>", value: "Unmute a user in voice chat", inline: false },
            { name: "/removetimeout <user>", value: "Remove a user's text chat timeout", inline: false },
            { name: "/setstorylength <lines>", value: "Set the story length (5–50 lines)", inline: false },
            { name: "/sepsearch <query>", value: "Search the SepataBase", inline: false },
            { name: "/mostactive", value: "Show the most active chatters in the server", inline: false },
          ],
        },
        {
          title: "✈️ Aviation & Weather",
          fields: [
            { name: "/radar <country>", value: "Get a live air traffic summary over a country with map", inline: false },
            { name: "/metar <icao>", value: "Get a METAR report for an airport using its ICAO code (e.g. EGLL, KJFK)", inline: false },
            { name: "/gpsjam", value: "Show a live global GPS jamming and interference map", inline: false },
          ],
        },
      ];
      let helpPage = 0;
      const totalHelpPages = helpPages.length;
      const buildHelpEmbed = (p) => new EmbedBuilder()
        .setTitle(helpPages[p].title)
        .addFields(helpPages[p].fields)
        .setColor(0x5865f2)
        .setFooter({ text: `Page ${p + 1} of ${totalHelpPages}` });
      const buildHelpRow = (p) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("help_prev").setLabel("⬅️ Previous").setStyle(ButtonStyle.Primary).setDisabled(p === 0),
        new ButtonBuilder().setCustomId("help_next").setLabel("Next ➡️").setStyle(ButtonStyle.Primary).setDisabled(p >= totalHelpPages - 1)
      );
      const helpMsg = await interaction.reply({ embeds: [buildHelpEmbed(helpPage)], components: [buildHelpRow(helpPage)], fetchReply: true, ephemeral: true });
      const helpCollector = helpMsg.createMessageComponentCollector({ time: 120000 });
      helpCollector.on("collect", async i => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: "You cannot control this menu.", ephemeral: true });
          return;
        }
        if (i.customId === "help_next") helpPage++;
        if (i.customId === "help_prev") helpPage--;
        await i.update({ embeds: [buildHelpEmbed(helpPage)], components: [buildHelpRow(helpPage)] });
      });
      helpCollector.on("end", async () => {
        try { await helpMsg.edit({ components: [] }); } catch (e) { console.error("Failed to remove buttons from help message:", e); }
      });
      break;
    }

    case "removetimeout": {
        if (!hasPermission(interaction, config.ownerId)) return;

        const userToUntimeout = interaction.options.getUser("user");
        if (!userToUntimeout) {
             return interaction.reply({ content: "Please provide a valid user.", ephemeral: true });
        }

        const guild = interaction.guild ?? await interaction.client.guilds.fetch(config.relayServerId);

        const memberToUntimeout = await guild.members.fetch(userToUntimeout.id).catch(() => null);
        if (!memberToUntimeout) {
            return interaction.reply({ content: "Could not find that user in this server.", ephemeral: true });
        }

        try {
            await memberToUntimeout.timeout(null, `Timeout removed by ${interaction.user.tag}`);
            await interaction.reply({ content: `Successfully removed timeout from ${memberToUntimeout.user.tag}.`, ephemeral: true });
        } catch (error) {
            console.error("Failed to remove timeout:", error);
            await interaction.reply({ content: "I was unable to remove the timeout. I may not have the 'Moderate Members' permission.", ephemeral: true });
        }
        break;
    }

    case "unmute": {
        if (!hasPermission(interaction, config.ownerId)) return;

        const userToUnmute = interaction.options.getUser("user");
        if (!userToUnmute) {
             return interaction.reply({ content: "Please provide a valid user to unmute.", ephemeral: true });
        }

        const guild = interaction.guild ?? await interaction.client.guilds.fetch(config.relayServerId);
        const memberToUnmute = await guild.members.fetch(userToUnmute.id).catch(() => null);

        if (!memberToUnmute) {
            return interaction.reply({ content: "Could not find that user in this server.", ephemeral: true });
        }

        if (!memberToUnmute.voice.channel) {
            return interaction.reply({ content: `${memberToUnmute.user.tag} is not in a voice channel.`, ephemeral: true });
        }

        try {
            await memberToUnmute.voice.setMute(false, `Unmuted by ${interaction.user.tag}`);
            await interaction.reply({ content: `Successfully unmuted ${memberToUnmute.user.tag}.`, ephemeral: true });
        } catch (error) {
            console.error("Failed to unmute user:", error);
            await interaction.reply({ content: "I was unable to unmute that user. I may not have the required permissions.", ephemeral: true });
        }
        break;
    }

    case "status":
      await interaction.deferReply({ ephemeral: true });
      await getStatus(interaction);
      break;
    case "restartbot":
      if (!hasPermission(interaction, config.ownerId)) return;
      await restartBot(interaction);
      break;
    case "restartscript":
      if (!hasPermission(interaction, config.ownerId)) return;
      await executeCommand(interaction, "pm2 restart steam-hour-farmer", "Script restarted successfully.");
      break;
    case "restartserver":
      if (!hasPermission(interaction, config.ownerId)) return;
      await executeCommand(interaction, "sudo reboot", "Server restart initiated.");
      break;
    case "purge":
      if (!hasPermission(interaction, config.ownerId)) return;
      await purgeMessages(interaction);
      break;
    case "maintenance": {
      if (!hasPermission(interaction, config.ownerId)) return;
      maintenanceMode = !maintenanceMode;
      const usageMonth = googleUsage.month || 'N/A';
      const usageCount = googleUsage.count || 0;
      await interaction.reply({
        content: `🔧 Maintenance mode **${maintenanceMode ? 'ENABLED — all commands blocked for non-owners' : 'DISABLED — bot is back online'}**.
📊 Google API usage this month: **${usageCount}/${GOOGLE_MONTHLY_LIMIT}** (${usageMonth})`,
        ephemeral: true
      });
      break;
    }
    case "quickpurge":
      if (!hasPermission(interaction, config.ownerId)) return;
      await quickPurgeMessages(interaction);
      break;
    case "scout":
      await handleGeoRig(interaction);
      break;
    case "spastic":
      await handleSpastic(interaction);
      break;
    case "geoguessr":
      await handleGeoguessr(interaction);
      break;
    case "sepsearch": {
      const query = interaction.options.getString("query").toLowerCase();
      const results = messages.filter(msg => msg.toLowerCase().includes(query));
      if (!results.length) {
        await interaction.reply({ content: `No results found for "${query}".`, ephemeral: true });
        break;
      }
      const pageSize = 10;
      let page = 0;
      const totalPages = Math.ceil(results.length / pageSize);
      const generateEmbed = (currentPage) => {
        const start = currentPage * pageSize;
        const end = start + pageSize;
        const pageMessages = results.slice(start, end);
        return new EmbedBuilder().setTitle(`Search results for "${query}"`).setDescription(pageMessages.map((m, i) => `${start + i + 1}. ${m}`).join("\n")).setFooter({ text: `Page ${currentPage + 1} of ${totalPages}` }).setColor(0x1abc9c);
      };
      const createNavRow = (currentPage, maxPages) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("prev").setLabel("⬅️ Previous").setStyle(ButtonStyle.Primary).setDisabled(currentPage === 0),
          new ButtonBuilder().setCustomId("next").setLabel("Next ➡️").setStyle(ButtonStyle.Primary).setDisabled(currentPage >= maxPages - 1)
        );
      };
      const msg = await interaction.reply({ embeds: [generateEmbed(page)], components: [createNavRow(page, totalPages)], fetchReply: true, ephemeral: true });
      const collector = msg.createMessageComponentCollector({ time: 60000 });
      collector.on("collect", async i => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({ content: "You cannot control this search.", ephemeral: true });
          return;
        }
        if (i.customId === "next") page++;
        if (i.customId === "prev") page--;
        await i.update({ embeds: [generateEmbed(page)], components: [createNavRow(page, totalPages)] });
      });
      collector.on("end", async () => {
        try { await msg.edit({ components: [] }); } catch (e) { console.error("Failed to remove buttons from search message:", e); }
      });
      break;
    }
    case "ask": {
        const askPermissions = permissions.features.ask;
        if (!askPermissions.enabled && !askPermissions.restrictedUsers.includes(interaction.user.id)) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }
        const geminiCheck = checkGeminiRateLimit(interaction.user.id);
        if (!geminiCheck.allowed) {
          return interaction.reply({ content: geminiCheck.reason, ephemeral: true });
        }
        const question = interaction.options.getString("question");
        const lowerCaseQuestion = question.toLowerCase();
        const flaggedWord = config.flaggedWords.find(word => lowerCaseQuestion.includes(word.toLowerCase()));
        if (flaggedWord) {
            const askLogMessage = `[FLAGGED] [${new Date().toISOString()}] User: ${interaction.user.tag} (${interaction.user.id}) | Guild: ${interaction.guild.name} (${interaction.guild.id}) | Question: "${question}"\n`;
            fs.appendFileSync("ask_log.txt", askLogMessage);
            try {
                const owner = await client.users.fetch(config.ownerId);
                await owner.send(`**Flagged Keyword Alert**\n**User:** ${interaction.user.tag} (${interaction.user.id})\n**Server:** ${interaction.guild.name}\n**Keyword:** "${flaggedWord}"\n**Full Question:** "${question}"`);
            } catch (error) {
                console.error("Failed to send flagged word alert DM to owner:", error);
            }
            return interaction.reply({ content: "This question cannot be processed due to the terminology used. Please rephrase your question.", ephemeral: true });
        }
        const askLogMessage = `[${new Date().toISOString()}] User: ${interaction.user.tag} (${interaction.user.id}) | Guild: ${interaction.guild.name} (${interaction.guild.id}) | Question: "${question}"\n`;
        fs.appendFileSync("ask_log.txt", askLogMessage);
        await interaction.deferReply();
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return interaction.editReply({ content: "The AI feature is not configured on the server." });
        }
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
            const payload = {
                ...(personality && { systemInstruction: { parts: [{ text: personality }] } }),
                contents: [{ parts: [{ text: question }] }],
            };
            const response = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
            let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                if (text.length > 2000) text = text.substring(0, 1900) + "...";
                await interaction.editReply({ content: `**Question:** ${question}\n\n**Answer:**\n${text}` });
            } else {
                await interaction.editReply({ content: "Sorry, the AI did not provide a response. Please try again." });
            }
        } catch (error) {
            console.error("Error calling Gemini API for text generation:", error.response ? error.response.data : error.message);
            await interaction.editReply({ content: "An error occurred while asking the AI. Please try again later." });
        }
        break;
    }
    case "josep":
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      await interaction.reply({ content: randomMessage });
      break;
    case "david":
      const randomMessageB = messagesB[Math.floor(Math.random() * messagesB.length)];
      await interaction.reply({ content: randomMessageB });
      break;
    case "log":
      if (!hasPermission(interaction, config.ownerId)) return;
      try {
        if (!fs.existsSync("command_log.txt") || fs.statSync("command_log.txt").size === 0) {
          await interaction.reply({ content: "Log is empty.", ephemeral: true });
          return;
        }
        const logData = fs.readFileSync("command_log.txt", "utf8");
        const maxLength = 1900;
        const response = logData.length > maxLength ? "Command Log (Truncated):\n\`\`\`" + logData.slice(-maxLength) + "\`\`\`" : "Command Log:\n\`\`\`" + logData + "\`\`\`";
        await interaction.reply({ content: response, ephemeral: true });
      } catch (error) {
        console.error("Error reading log:", error);
        await interaction.reply({ content: "Error reading log file.", ephemeral: true });
      }
      break;
    case "clearlog":
      if (!hasPermission(interaction, config.ownerId)) return;
      try {
        fs.writeFileSync("command_log.txt", "");
        await interaction.reply({ content: "Command log cleared.", ephemeral: true });
      } catch (error) {
        console.error("Error clearing log:", error);
        await interaction.reply({ content: "Error clearing log file.", ephemeral: true });
      }
      break;
    case "toggleprotection": {
      if (!hasPermission(interaction, config.ownerId)) return;
      autoRemoveTimeoutEnabled = !autoRemoveTimeoutEnabled;
      await interaction.reply({ content: `Timeout protection is now **${autoRemoveTimeoutEnabled ? 'ON' : 'OFF'}**.`, ephemeral: true });
      break;
    }
    case "adhan": {
      if (!hasPermission(interaction, config.ownerId)) return;
      await interaction.reply({ content: '🕌 Playing Adhan...', ephemeral: true });
      await playAdhan(client, 'Test');
      break;
    }
    case "setstorylength": {
      const lines = interaction.options.getInteger("lines");
      setGuildSettings(interaction.guildId, { storyLength: lines });
      await interaction.reply({ content: `Story length set to **${lines}** lines.`, ephemeral: true });
      break;
    }
    case "setpersonality": {
      if (!config.personalityUsers.includes(interaction.user.id)) {
        await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        return;
      }
      const description = interaction.options.getString("description");
      personality = description;
      savePersonality();
      await interaction.reply({ content: `Personality set to: *${description}*`, ephemeral: true });
      break;
    }
    case "clearpersonality": {
      if (!hasPermission(interaction, config.ownerId)) return;
      personality = null;
      savePersonality();
      await interaction.reply({ content: "Personality cleared. AI is back to normal.", ephemeral: true });
      break;
    }
    case "8ball": {
      if (!isFeatureEnabled("8ball")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const question = interaction.options.getString("question");

      // ─── Default answers ───────────────────────────────────────────
      const defaultAnswers = [
        // Positive
        "It is certain.", "It is decidedly so.", "Without a doubt.",
        "Yes, definitely.", "You may rely on it.", "As I see it, yes.",
        "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.",
        // Neutral
        "Reply hazy, try again.", "Ask again later.",
        "Better not tell you now.", "Cannot predict now.",
        "Concentrate and ask again.",
        // Negative
        "Don't count on it.", "My reply is no.", "My sources say no.",
        "Outlook not so good.", "Very doubtful.",
      ];

      // ─── Add your custom answers below ────────────────────────────
      const customAnswers = [
        "50% chance of terminal cancer on the horizon",
        "Ask later when im done fucking davids mum",
        "Israel has the right to defend itself",
        "more chance of Iwan landing smoothly",
        "Sounds like one of jays groundbreaking ideas",
        "Davids mum quitting sex working is more likely than that",
        "I think you should join ISIS and forget about it",
        "3 hits with a clawhammer and this all goes away",
        "मुझे करी बहुत पसंद है - Deepinthesand",
        "I am a female police officer",
        "I am a 100% self taught volanta flight simulation enthusiast",
        "boobies :3",
        "Step 1. Get some bitches. Step 2. Go outside",
      ];

      const josepQuote = messages[Math.floor(Math.random() * messages.length)];
      const allAnswers = [...defaultAnswers, ...customAnswers, josepQuote];
      const answer = allAnswers[Math.floor(Math.random() * allAnswers.length)];

      await interaction.reply(`🎱 **${question}**\n> ${answer}`);
      break;
    }
    case "personality": {
      if (!personality) {
        await interaction.reply({ content: "No custom personality is set. The AI is behaving normally.", ephemeral: true });
      } else {
        await interaction.reply({ content: `**Current personality:**\n${personality}`, ephemeral: true });
      }
      break;
    }
    case "trivia": {
      if (!isFeatureEnabled("trivia")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const TRIVIA_COOLDOWN = 30 * 1000;
      const lastTrivia = triviaCooldowns.get(interaction.channelId) || 0;
      const triviaRemaining = TRIVIA_COOLDOWN - (Date.now() - lastTrivia);
      if (triviaRemaining > 0) {
        return interaction.reply({ content: `Wait **${Math.ceil(triviaRemaining / 1000)}s** before starting another question.`, ephemeral: true });
      }
      triviaCooldowns.set(interaction.channelId, Date.now());

      await interaction.deferReply();
      try {
        const triviaRes = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const raw = triviaRes.data.results[0];

        const question = decodeHtml(raw.question);
        const correct = decodeHtml(raw.correct_answer);
        const allOptions = [correct, ...raw.incorrect_answers.map(decodeHtml)].sort(() => Math.random() - 0.5);
        const correctIndex = allOptions.indexOf(correct);

        const labels = ['A', 'B', 'C', 'D'];
        const embed = new EmbedBuilder()
          .setTitle('🎯 Trivia Time!')
          .setDescription(`**${question}**\n\n${allOptions.map((o, i) => `**${labels[i]}:** ${o}`).join('\n')}`)
          .setFooter({ text: `${raw.category} · ${raw.difficulty} · 30 seconds to answer!` })
          .setColor(0x3498db);

        const row = new ActionRowBuilder().addComponents(
          labels.map((label, i) =>
            new ButtonBuilder().setCustomId(`trivia_${i}`).setLabel(label).setStyle(ButtonStyle.Primary)
          )
        );

        const triviaMsg = await interaction.editReply({ embeds: [embed], components: [row] });
        const answered = new Set();
        const collector = triviaMsg.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async (i) => {
          if (answered.has(i.user.id)) {
            return i.reply({ content: "You already answered!", ephemeral: true });
          }
          answered.add(i.user.id);
          const chosen = parseInt(i.customId.split('_')[1]);

          if (chosen === correctIndex) {
            awardTriviaPoint(i.user.id, i.user.username);
            const points = triviaScores[i.user.id].points;
            collector.stop('answered');
            await i.reply({ content: `✅ **${i.user.displayName}** got it! The answer was **${labels[correctIndex]}: ${correct}**\nThey now have **${points}** point${points !== 1 ? 's' : ''}.` });
          } else {
            await i.reply({ content: `❌ Wrong answer!`, ephemeral: true });
          }
        });

        collector.on('end', async (_, reason) => {
          const disabledRow = new ActionRowBuilder().addComponents(
            labels.map((label, i) =>
              new ButtonBuilder()
                .setCustomId(`trivia_${i}_done`)
                .setLabel(label)
                .setStyle(i === correctIndex ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(true)
            )
          );
          await interaction.editReply({ embeds: [embed.setFooter({ text: `${raw.category} · ${raw.difficulty} · Question closed.` })], components: [disabledRow] });
          if (reason !== 'answered') {
            await interaction.followUp({ content: `⏰ Nobody got it! The answer was **${labels[correctIndex]}: ${correct}**` });
          }
        });

      } catch (error) {
        console.error("Trivia error:", error.message);
        await interaction.editReply({ content: "Failed to fetch a trivia question. Try again." });
      }
      break;
    }
    case "triviascores": {
      const sorted = Object.entries(triviaScores).sort((a, b) => b[1].points - a[1].points).slice(0, 10);
      if (!sorted.length) {
        return interaction.reply({ content: "No scores yet! Use `/trivia` to start.", ephemeral: true });
      }
      const medals = ['🥇', '🥈', '🥉'];
      const leaderboard = sorted.map(([, data], i) => `${medals[i] || `**${i + 1}.**`} ${data.username} — **${data.points}** point${data.points !== 1 ? 's' : ''}`).join('\n');
      const scoreEmbed = new EmbedBuilder()
        .setTitle('🏆 Trivia Leaderboard')
        .setDescription(leaderboard)
        .setColor(0xf1c40f);
      await interaction.reply({ embeds: [scoreEmbed] });
      break;
    }
    case "roulette": {
      if (!isFeatureEnabled("roulette")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const ROULETTE_COOLDOWN = 5 * 60 * 1000;
      if (!rageModeActive) {
        const lastUsed = rouletteCooldowns.get(interaction.user.id) || 0;
        const remaining = ROULETTE_COOLDOWN - (Date.now() - lastUsed);
        if (remaining > 0) {
          const secs = Math.ceil(remaining / 1000);
          return interaction.reply({ content: `You need to wait **${secs}s** before spinning again.`, ephemeral: true });
        }
      }
      rouletteCooldowns.set(interaction.user.id, Date.now());

      const sleep = ms => new Promise(r => setTimeout(r, ms));

      await interaction.deferReply();

      const ROULETTE_EXEMPT = new Set([
        '669416660616216605',
        '321042869148450816',
        '822006025229959168',
        '841776694766731325',
      ]);

      const allMembers = await interaction.guild.members.list({ limit: 1000 });
      const eligible = [...allMembers.filter(m => !m.user.bot && !ROULETTE_EXEMPT.has(m.id)).values()];

      // Wheel: one slot per member + one safe slot at the end (safe removed during rage mode)
      const wheel = rageModeActive
        ? [...eligible.map(m => ({ label: m.displayName, member: m }))]
        : [...eligible.map(m => ({ label: m.displayName, member: m })), { label: '🛡️ SAFE', member: null }];
      const totalSlots = wheel.length;

      const renderWheel = (pos) => {
        const dots = wheel.map((slot, i) => {
          if (i === pos) return slot.member ? '●' : '★';
          return slot.member ? '○' : '☆';
        }).join(' ');
        return `\`[ ${dots} ]\`\n**→ ${wheel[pos].label}**`;
      };

      // Pre-determine outcome
      const RIGGED_USER_ID = "1185384902200401931";
      const isRiggedUser = interaction.user.id === RIGGED_USER_ID;
      const isBang = rageModeActive || isRiggedUser || Math.random() < 0.5;
      const targetMember = isBang
        ? (isRiggedUser ? eligible.find(m => m.id === RIGGED_USER_ID) ?? eligible[Math.floor(Math.random() * eligible.length)] : eligible[Math.floor(Math.random() * eligible.length)])
        : null;
      const finalPos = isBang
        ? wheel.findIndex(s => s.member?.id === targetMember.id)
        : totalSlots - 1;

      // Animation: random positions slowing into the final result
      const frames = [
        Math.floor(Math.random() * totalSlots),
        Math.floor(Math.random() * totalSlots),
        Math.floor(Math.random() * totalSlots),
        Math.floor(Math.random() * totalSlots),
        finalPos,
      ];
      const delays = [350, 400, 500, 750, 1000];
      const labels = ['Spinning the chamber...', 'Spinning...', 'Spinning...', 'Slowing down...', 'The chamber settles...'];

      for (let i = 0; i < frames.length; i++) {
        await interaction.editReply({ content: `🔫 **${labels[i]}**\n${renderWheel(frames[i])}` });
        await sleep(delays[i]);
      }

      if (!isBang) {
        const spinnerId = interaction.user.id;
        const safeCount = (safeStreaks.get(spinnerId) || 0) + 1;
        safeStreaks.set(spinnerId, safeCount);

        if (safeCount >= 3) {
          safeStreaks.set(spinnerId, 0);
          const spinnerMember = await interaction.guild.members.fetch(spinnerId).catch(() => null);
          await interaction.editReply({ content: `🔫 *click* **SAFE!** ...But that's 3 safes in a row. The roulette gods are not amused. <@${spinnerId}> gets **4 hours** of silence.` });
          if (spinnerMember) {
            try {
              if (spinnerId === config.ownerId) rouletteTimeoutActive = true;
              await spinnerMember.timeout(4 * 60 * 60 * 1000, 'Roulette: 3 safes in a row');
              if (spinnerId === config.ownerId) setTimeout(() => { rouletteTimeoutActive = false; }, 5000);
            } catch (e) {
              console.error('Safe streak timeout failed:', e.message);
            }
          }
        } else {
          await interaction.editReply({ content: `🔫 *click* **SAFE!** The roulette spared everyone today. *(${safeCount}/3 safes)*` });
        }
      } else {
        try {
          // Escalating mute duration based on consecutive mutes
          const STREAK_RESET_MS = 2 * 60 * 60 * 1000; // streak resets after 2h of no mute
          const streakData = rouletteStreaks.get(targetMember.id) || { count: 0, lastMutedAt: 0 };
          const currentStreak = (Date.now() - streakData.lastMutedAt > STREAK_RESET_MS) ? 0 : streakData.count;
          const timeoutDuration = MUTE_DURATIONS_MS[Math.min(currentStreak, MUTE_DURATIONS_MS.length - 1)];
          rouletteStreaks.set(targetMember.id, { count: currentStreak + 1, lastMutedAt: Date.now() });
          saveRouletteStreaks();

          safeStreaks.set(interaction.user.id, 0);
          if (targetMember.id === config.ownerId) rouletteTimeoutActive = true;
          await targetMember.timeout(timeoutDuration, "Roulette victim");
          if (targetMember.id === config.ownerId) setTimeout(() => { rouletteTimeoutActive = false; }, 5000);

          const fmtMs = ms => { const m = ms / 60000; return m >= 60 ? `${m / 60}h` : `${m}m`; };
          const durationLabel = fmtMs(timeoutDuration);
          const streakSuffix = currentStreak > 0 ? ` *(${currentStreak + 1}x in a row — streak penalty!)*` : '';
          await interaction.editReply({ content: `💥 **BANG!** <@${targetMember.id}> — enjoy your **${durationLabel}** of silence.${streakSuffix}` });

          // 4% chance of double or nothing (not during rage mode)
          if (!rageModeActive && Math.random() < 0.04) {
            try {
              const tRes = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple', { timeout: 5000 });
              const q = tRes.data.results?.[0];
              if (q) {
                const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                const correct = decode(q.correct_answer);
                const answers = [...q.incorrect_answers.map(decode), correct].sort(() => Math.random() - 0.5);
                const doubleDurationLabel = fmtMs(timeoutDuration * 2);

                const row = new ActionRowBuilder().addComponents(
                  answers.map((ans, i) => new ButtonBuilder()
                    .setCustomId(`don_${i}_${interaction.id}`)
                    .setLabel(ans)
                    .setStyle(ButtonStyle.Primary)
                  )
                );

                const donMsg = await interaction.followUp({
                  ephemeral: true,
                  content: `🎲 **DOUBLE OR NOTHING!**

Answer correctly → <@${targetMember.id}>'s timeout doubles to **${doubleDurationLabel}**.
Answer wrong → YOU get **${durationLabel}**.

**${decode(q.question)}**

*You have 30 seconds.*`,
                  components: [row],
                });

                try {
                  const btn = await donMsg.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id && i.customId.startsWith(`don_`) && i.customId.endsWith(`_${interaction.id}`),
                    time: 30000,
                  });

                  const chosen = answers[parseInt(btn.customId.split('_')[1])];
                  if (chosen === correct) {
                    if (targetMember.id === config.ownerId) rouletteTimeoutActive = true;
                    await targetMember.timeout(timeoutDuration * 2, 'Roulette: double or nothing — spinner correct');
                    if (targetMember.id === config.ownerId) setTimeout(() => { rouletteTimeoutActive = false; }, 5000);
                    await btn.update({ content: `✅ Correct! <@${targetMember.id}>'s timeout has been doubled to **${doubleDurationLabel}**.`, components: [] });
                  } else {
                    // Free the victim
                    await targetMember.timeout(null, 'Roulette: double or nothing — spinner wrong, victim freed').catch(() => {});
                    // Timeout the spinner
                    const spinnerMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                    if (spinnerMember) {
                      if (interaction.user.id === config.ownerId) rouletteTimeoutActive = true;
                      await spinnerMember.timeout(timeoutDuration, 'Roulette: double or nothing — spinner wrong');
                      if (interaction.user.id === config.ownerId) setTimeout(() => { rouletteTimeoutActive = false; }, 5000);
                    }
                    await btn.update({ content: `❌ Wrong! The correct answer was **${correct}**. <@${targetMember.id}> goes free — you get **${durationLabel}** of silence instead.`, components: [] });
                  }
                } catch {
                  // No answer — same as wrong: free victim, timeout spinner
                  await targetMember.timeout(null, 'Roulette: double or nothing — no answer, victim freed').catch(() => {});
                  const spinnerMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                  if (spinnerMember) {
                    if (interaction.user.id === config.ownerId) rouletteTimeoutActive = true;
                    await spinnerMember.timeout(timeoutDuration, 'Roulette: double or nothing — no answer').catch(() => {});
                    if (interaction.user.id === config.ownerId) setTimeout(() => { rouletteTimeoutActive = false; }, 5000);
                  }
                  await donMsg.edit({ content: `⏱️ Time's up! <@${targetMember.id}> goes free — <@${interaction.user.id}> gets **${durationLabel}** for not answering.`, components: [] }).catch(() => {});
                }
              }
            } catch (e) {
              console.error('Double or nothing error:', e.message);
            }
          }
        } catch (error) {
          console.error("Roulette timeout failed:", error);
          await interaction.editReply({ content: `💥 **BANG!** The roulette landed on <@${targetMember.id}>... but I couldn't time them out. Count yourself lucky.` });
        }
      }
      break;
    }
    case "radar": {
      if (!isFeatureEnabled("radar")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const countryInput = interaction.options.getString("country").toLowerCase().trim();
      const bbox = COUNTRY_BBOXES[countryInput];
      if (!bbox) {
        return interaction.reply({ content: `Unknown country. Try a country name (e.g. \`France\`) or 2-letter code (e.g. \`FR\`). Most countries and territories are supported.`, ephemeral: true });
      }
      await interaction.deferReply();
      try {
        const res = await axios.get(
          `https://opensky-network.org/api/states/all?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`,
          { timeout: 15000 }
        );
        const states = (res.data?.states || []).filter(s => !s[8]);
        if (!states.length) {
          return interaction.editReply(`No airborne aircraft detected over **${bbox.name}** right now.`);
        }

        const withAlt = states.filter(s => s[7] != null);
        const withSpd = states.filter(s => s[9] != null);
        const highest = withAlt.length ? withAlt.reduce((a, b) => a[7] > b[7] ? a : b) : null;
        const fastest = withSpd.length ? withSpd.reduce((a, b) => a[9] > b[9] ? a : b) : null;
        const avgAlt = withAlt.length ? Math.round(withAlt.reduce((s, a) => s + a[7], 0) / withAlt.length * 3.28084) : null;
        const avgSpd = withSpd.length ? Math.round(withSpd.reduce((s, a) => s + a[9], 0) / withSpd.length * 1.94384) : null;
        const countryCounts = {};
        for (const s of states) {
          const c = s[2] || 'Unknown';
          countryCounts[c] = (countryCounts[c] || 0) + 1;
        }
        const topOrigins = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${c} (${n})`).join(', ');

        // Build Mapbox static map with real geography + aircraft positions
        const withPos = states.filter(s => s[5] != null && s[6] != null);
        // Sample down to 75 aircraft max to keep URL length manageable
        const sampled = withPos.length > 75
          ? withPos.sort(() => 0.5 - Math.random()).slice(0, 75)
          : withPos;

        const centerLat = (bbox.lamin + bbox.lamax) / 2;
        const centerLon = (bbox.lomin + bbox.lomax) / 2;
        // Zoom based on actual aircraft spread (not full country bbox) for a closer view
        const posLats = withPos.map(s => s[6]);
        const posLons = withPos.map(s => s[5]);
        const spreadLat = withPos.length > 1 ? Math.max(...posLats) - Math.min(...posLats) : (bbox.lamax - bbox.lamin);
        const spreadLon = withPos.length > 1 ? Math.max(...posLons) - Math.min(...posLons) : (bbox.lomax - bbox.lomin);
        const latZoom = Math.log2((550 / 512) * (180 / Math.max(spreadLat, 0.5)));
        const lonZoom = Math.log2((900 / 512) * (360 / Math.max(spreadLon, 0.5)));
        const zoom = Math.max(4, Math.min(9, Math.floor(Math.min(latZoom, lonZoom))));

        const embed = new EmbedBuilder()
          .setTitle(`🛫 Live Radar — ${bbox.name}`)
          .addFields(
            { name: '✈️ Airborne', value: `**${states.length}** aircraft`, inline: true },
            { name: '📍 Avg Altitude', value: avgAlt ? `${avgAlt.toLocaleString()} ft` : 'N/A', inline: true },
            { name: '💨 Avg Speed', value: avgSpd ? `${avgSpd} kt` : 'N/A', inline: true },
            { name: '🏔️ Highest', value: highest ? `${((highest[1] || '').trim() || highest[0])} @ ${Math.round(highest[7] * 3.28084).toLocaleString()} ft` : 'N/A', inline: true },
            { name: '⚡ Fastest', value: fastest ? `${((fastest[1] || '').trim() || fastest[0])} @ ${Math.round(fastest[9] * 1.94384)} kt` : 'N/A', inline: true },
            { name: '🌍 Top Origins', value: topOrigins || 'N/A', inline: false },
          )
          .setColor(0x0d1117)
          .setTimestamp();

        if (!config.mapboxToken) {
          embed.setFooter({ text: 'Source: OpenSky Network • Add mapboxToken to config for map image (free at mapbox.com)' });
          await interaction.editReply({ embeds: [embed] });
        } else {
          try {
            // Fetch clean dark basemap — no marker overlay
            const basemapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${centerLon},${centerLat},${zoom}/900x550?access_token=${config.mapboxToken}`;
            const basemapRes = await axios.get(basemapUrl, { responseType: 'arraybuffer', timeout: 20000 });

            if (Jimp) {
              // ── FR24-style rendering ──────────────────────────────────────
              const rawBuf = Buffer.from(basemapRes.data);
              const image = await (typeof Jimp.fromBuffer === 'function' ? Jimp.fromBuffer(rawBuf) : Jimp.read(rawBuf));
              const W = image.bitmap.width;   // 900
              const H = image.bitmap.height;  // 550

              // Web Mercator lon/lat → image pixel (Mapbox uses 512px tiles)
              const worldPx = 512 * Math.pow(2, zoom);
              const lonToWx = l => (l + 180) / 360 * worldPx;
              const latToWy = l => {
                const r = l * Math.PI / 180;
                return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * worldPx;
              };
              const cWx = lonToWx(centerLon), cWy = latToWy(centerLat);
              const toPixel = (lon, lat) => ({
                x: Math.round(lonToWx(lon) - cWx + W / 2),
                y: Math.round(latToWy(lat) - cWy + H / 2),
              });

              // Drawing helpers
              const setPixel = (x, y, c) => {
                if (x >= 0 && x < W && y >= 0 && y < H) image.setPixelColor(c, x, y);
              };
              const drawDot = (cx, cy, c, r) => {
                for (let dx = -r; dx <= r; dx++)
                  for (let dy = -r; dy <= r; dy++)
                    if (dx * dx + dy * dy <= r * r) setPixel(cx + dx, cy + dy, c);
              };
              const drawLine = (x0, y0, x1, y1, c) => {
                let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
                let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
                for (let i = 0; i < 60; i++) {
                  setPixel(x0, y0, c);
                  if (x0 === x1 && y0 === y1) break;
                  const e2 = 2 * err;
                  if (e2 > -dy) { err -= dy; x0 += sx; }
                  if (e2 < dx) { err += dx; y0 += sy; }
                }
              };

              // Draw all aircraft (no sample cap — no URL length constraint)
              for (const s of withPos) {
                const { x, y } = toPixel(s[5], s[6]);
                const altFt   = s[7]  != null ? Math.round(s[7]  * 3.28084) : null;
                const heading = s[10]; // true track degrees, 0=N clockwise

                // Altitude colour coding (FR24 style)
                const dot = altFt == null ? 0x888888ff
                  : altFt > 25000        ? 0x00d2ffff  // cyan  — high cruise
                  : altFt > 5000         ? 0xffd740ff  // amber — normal
                  :                        0xff5252ff; // red   — low / approach

                // Heading tail: semi-transparent line extending behind the aircraft
                if (heading != null) {
                  const tailRad = ((heading + 180) % 360) * Math.PI / 180;
                  const tx = Math.round(x + Math.sin(tailRad) * 9);
                  const ty = Math.round(y - Math.cos(tailRad) * 9);
                  drawLine(x, y, tx, ty, ((dot & 0xffffff00) | 0x66) >>> 0);
                }

                // Solid dot (3px radius)
                drawDot(x, y, dot, 3);
              }

              const outBuf = typeof image.getBufferAsync === 'function'
                ? await image.getBufferAsync('image/png')
                : await image.getBuffer('image/png');
              const attachment = new AttachmentBuilder(outBuf, { name: 'radar.png' });
              embed.setImage('attachment://radar.png')
                .setFooter({ text: `OpenSky • Mapbox • ${withPos.length} aircraft • 🔵>25k ft  🟡>5k ft  🔴<5k ft` });
              await interaction.editReply({ embeds: [embed], files: [attachment] });

            } else {
              // ── Fallback: pin markers (run npm install jimp for FR24 style) ──
              const markers = sampled
                .map(s => `pin-s-airport+00d2ff(${s[5].toFixed(4)},${s[6].toFixed(4)})`)
                .join(',');
              const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markers}/${centerLon},${centerLat},${zoom}/900x550?access_token=${config.mapboxToken}`;
              const mapRes = await axios.get(mapUrl, { responseType: 'arraybuffer', timeout: 20000 });
              const attachment = new AttachmentBuilder(Buffer.from(mapRes.data), { name: 'radar.png' });
              embed.setImage('attachment://radar.png')
                .setFooter({ text: `OpenSky • Mapbox • ${sampled.length}/${states.length} aircraft • run npm install jimp for FR24-style rendering` });
              await interaction.editReply({ embeds: [embed], files: [attachment] });
            }

          } catch (mapErr) {
            console.error("Radar map generation failed:", mapErr.message);
            embed.setFooter({ text: 'Source: OpenSky Network (map unavailable)' });
            await interaction.editReply({ embeds: [embed] });
          }
        }

      } catch (error) {
        console.error("Radar error:", error.message);
        await interaction.editReply("Failed to fetch radar data. Try again later.");
      }
      break;
    }
    case "metar": {
      const icao = interaction.options.getString("icao").toUpperCase().trim();
      if (!/^[A-Z]{4}$/.test(icao)) {
        return interaction.reply({ content: "Invalid ICAO code. Must be 4 letters (e.g. `EGLL`, `KJFK`).", ephemeral: true });
      }
      await interaction.deferReply();
      try {
        const haversineNm = (lat1, lon1, lat2, lon2) => {
          const R = 3440.065; // nautical miles
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        let res = await axios.get(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`);
        let data = res.data;
        let nearestNote = null;

        if (!data || data.length === 0) {
          // Look up station coordinates, then find nearest METAR
          const stationRes = await axios.get(`https://aviationweather.gov/api/data/stationinfo?ids=${icao}&format=json`);
          const station = stationRes.data?.[0];
          if (!station || station.lat == null) {
            return interaction.editReply(`No METAR or station info found for **${icao}**. Check the ICAO code.`);
          }
          const { lat, lon } = station;
          const deg = 3;
          const bboxRes = await axios.get(
            `https://aviationweather.gov/api/data/metar?bbox=${lat-deg},${lon-deg},${lat+deg},${lon+deg}&format=json`
          );
          const nearby = bboxRes.data;
          if (!nearby || nearby.length === 0) {
            return interaction.editReply(`No METAR found for **${icao}** or any nearby stations.`);
          }
          nearby.sort((a, b) => haversineNm(lat, lon, a.lat, a.lon) - haversineNm(lat, lon, b.lat, b.lon));
          data = [nearby[0]];
          const dist = Math.round(haversineNm(lat, lon, nearby[0].lat, nearby[0].lon));
          nearestNote = `⚠️ No METAR for **${icao}** — showing nearest: **${nearby[0].icaoId}** (${dist} nm away)`;
        }
        const m = data[0];
        const raw = m.rawOb || "N/A";
        const name = m.name || icao;
        const time = m.reportTime ? `<t:${Math.floor(new Date(m.reportTime + ' UTC').getTime() / 1000)}:R>` : "Unknown";

        const windDir = m.wdir === 0 && m.wspd === 0 ? "Calm" : m.wdir != null ? `${String(m.wdir).padStart(3, '0')}°` : "VRB";
        const windSpd = m.wspd != null ? `${m.wspd}kt` : "N/A";
        const windGust = m.wgst ? ` gusting ${m.wgst}kt` : "";
        const wind = m.wspd === 0 && m.wdir === 0 ? "Calm" : `${windDir} @ ${windSpd}${windGust}`;

        const temp = m.temp != null ? `${m.temp}°C` : "N/A";
        const dewp = m.dewp != null ? `${m.dewp}°C` : "N/A";
        const altim = m.altim != null ? `${m.altim} hPa` : "N/A";
        const vis = m.visib != null ? (m.visib === "10+" ? "10+ km" : `${m.visib} sm`) : "N/A";
        const wx = m.wxString || "None";
        const clouds = Array.isArray(m.clouds) && m.clouds.length > 0
          ? m.clouds.map(c => `${c.cover} @ ${c.base}ft`).join(", ")
          : "Clear";
        const flightCat = m.fltcat || null;
        const catColors = { VFR: 0x00b300, MVFR: 0x0000ff, IFR: 0xff0000, LIFR: 0x9900cc };
        const color = catColors[flightCat] || 0x2c2f33;

        const embed = new EmbedBuilder()
          .setTitle(`✈️ METAR — ${icao} (${name})`)
          .setDescription(`\`\`\`${raw}\`\`\``)
          .addFields(
            { name: "🕐 Observed", value: time, inline: true },
            { name: "💨 Wind", value: wind, inline: true },
            { name: "👁️ Visibility", value: vis, inline: true },
            { name: "🌡️ Temp / Dewpoint", value: `${temp} / ${dewp}`, inline: true },
            { name: "🌡️ Altimeter", value: altim, inline: true },
            { name: "🌦️ Weather", value: wx, inline: true },
            { name: "☁️ Clouds", value: clouds, inline: false },
          )
          .setColor(color)
          .setFooter({ text: flightCat ? `Flight Category: ${flightCat}` : "Source: NOAA Aviation Weather Center" });

        await interaction.editReply({ content: nearestNote ?? undefined, embeds: [embed] });
      } catch (error) {
        console.error("METAR fetch error:", error.message);
        await interaction.editReply("Failed to fetch METAR. Try again later.");
      }
      break;
    }
    case "usermood": {
      if (!isFeatureEnabled("mood")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return interaction.reply({ content: "The AI feature is not configured.", ephemeral: true });

      const geminiCheck = checkGeminiRateLimit(interaction.user.id);
      if (!geminiCheck.allowed) return interaction.reply({ content: geminiCheck.reason, ephemeral: true });

      const targetUser = interaction.options.getUser("user");
      await interaction.deferReply();
      try {
        const fetched = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = [...fetched.values()]
          .filter(m => m.author.id === targetUser.id && m.content.trim().length > 0)
          .reverse()
          .map(m => m.content);

        if (userMessages.length < 3) {
          return interaction.editReply(`Not enough recent messages from **${targetUser.username}** in this channel to analyse.`);
        }

        const prompt = `You are a brutally honest, slightly unhinged mood analyst. Based ONLY on these recent Discord messages from one person, write a short personal mood report (3-5 sentences). Include: a vibe label (e.g. "Passive Aggressively Coping", "Disturbingly Chipper", "On The Edge"), a mood score out of 10, and a blunt personal assessment of their current mental state. Be funny and specific to what they actually said. Do not be nice about it.\n\nMessages:\n${userMessages.join('\n')}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        const response = await axios.post(apiUrl, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { headers: { 'Content-Type': 'application/json' } });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return interaction.editReply("Couldn't analyse their mood. Try again.");

        const embed = new EmbedBuilder()
          .setTitle(`🧠 Mood Report — ${targetUser.username}`)
          .setDescription(text)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: `Based on their last ${userMessages.length} messages in #${interaction.channel.name}` })
          .setColor(0xe67e22)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error("User mood error:", error.message);
        await interaction.editReply("Failed to analyse their mood. Try again later.");
      }
      break;
    }
    case "josephmood": {
      if (!isFeatureEnabled("mood")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return interaction.reply({ content: "The AI feature is not configured.", ephemeral: true });

      const jmGeminiCheck = checkGeminiRateLimit(interaction.user.id);
      if (!jmGeminiCheck.allowed) return interaction.reply({ content: jmGeminiCheck.reason, ephemeral: true });

      await interaction.deferReply();
      try {
        const shuffled = [...messages].sort(() => Math.random() - 0.5);
        const sample = shuffled.slice(0, 20);

        const prompt = `You are a ruthless, judgemental critic with absolutely no filter and zero sympathy. You've been given 20 real messages from a person called Joseph. Based ONLY on these messages, write a savage personal mood report (4-6 sentences). Include: a scathing vibe label, a mood score out of 10 (probably low), and a brutally honest personal assessment of what kind of person Joseph appears to be. Be mean, be specific, be funny. Make it sting. Do not be kind or encouraging under any circumstances.

Joseph's messages:
${sample.join(String.fromCharCode(10))}`;

        const jmApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        const jmResponse = await axios.post(jmApiUrl, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { headers: { 'Content-Type': 'application/json' } });

        const jmText = jmResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jmText) return interaction.editReply("Couldn't analyse Joseph's mood. Surprising — you'd think someone that loud would be easy to read.");

        const jmEmbed = new EmbedBuilder()
          .setTitle('🧠 Joseph Mood Report')
          .setDescription(jmText)
          .setFooter({ text: 'Based on 20 randomly selected Joseph messages' })
          .setColor(0xe74c3c)
          .setTimestamp();

        await interaction.editReply({ embeds: [jmEmbed] });
      } catch (error) {
        console.error("Joseph mood error:", error.message);
        await interaction.editReply("Failed to analyse Joseph's mood. He's probably too erratic to profile.");
      }
      break;
    }
    case "mood": {
      if (!isFeatureEnabled("mood")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return interaction.reply({ content: "The AI feature is not configured on the server.", ephemeral: true });
      }
      const moodGeminiCheck = checkGeminiRateLimit(interaction.user.id);
      if (!moodGeminiCheck.allowed) return interaction.reply({ content: moodGeminiCheck.reason, ephemeral: true });
      await interaction.deferReply();
      try {
        const fetched = await interaction.channel.messages.fetch({ limit: 50 });
        const recentMessages = [...fetched.values()]
          .filter(m => !m.author.bot && m.content.trim().length > 0)
          .reverse()
          .map(m => `${m.author.username}: ${m.content}`)
          .join('\n');

        if (!recentMessages.length) {
          return interaction.editReply("Not enough messages to analyse the mood.");
        }

        const prompt = `You are a witty, slightly sarcastic server mood analyser. Based on the following recent Discord messages, give a short mood report (3-5 sentences max). Include: an overall vibe label (e.g. "Chaotic Neutral", "Aggressively Bored", "Surprisingly Wholesome"), a mood score out of 10, and a brief funny summary of what's going on. Be blunt and funny.\n\nMessages:\n${recentMessages}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        const response = await axios.post(apiUrl, {
          contents: [{ parts: [{ text: prompt }] }]
        }, { headers: { 'Content-Type': 'application/json' } });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return interaction.editReply("Couldn't analyse the mood. Try again.");

        const moodEmbed = new EmbedBuilder()
          .setTitle('🧠 Server Mood Report')
          .setDescription(text)
          .setFooter({ text: `Based on the last ${fetched.filter(m => !m.author.bot).size} messages in #${interaction.channel.name}` })
          .setColor(0x9b59b6)
          .setTimestamp();

        await interaction.editReply({ embeds: [moodEmbed] });
      } catch (error) {
        console.error("Mood analysis error:", error.message);
        await interaction.editReply("Failed to analyse the mood. Try again later.");
      }
      break;
    }
    case "mostactive": {
      const sorted = Object.entries(messageCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);
      if (!sorted.length) {
        return interaction.reply({ content: "No message data yet! Start chatting.", ephemeral: true });
      }

      // Always place CF in 3rd or 4th position (display only, real counts unchanged)
      let display = [...sorted];
      const cfIdx = display.findIndex(([id]) => id === config.ownerId);
      if (cfIdx !== -1 && display.length >= 3) {
        const [cfId, cfData] = display.splice(cfIdx, 1)[0];
        const targetPos = Math.random() < 0.5 ? 2 : Math.min(3, display.length);
        const countAbove = display[targetPos - 1][1].count;
        const countBelow = display[targetPos] ? display[targetPos][1].count : Math.max(1, countAbove - 5);
        const fakeCount = countBelow + 1 + Math.floor(Math.random() * Math.max(1, countAbove - countBelow - 1));
        display.splice(targetPos, 0, [cfId, { ...cfData, count: fakeCount }]);
        display = display.slice(0, 10);
      }

      const medals = ['🥇', '🥈', '🥉'];
      const leaderboard = display
        .map(([, data], i) => `${medals[i] || `**${i + 1}.**`} ${data.username} — **${data.count.toLocaleString()}** message${data.count !== 1 ? 's' : ''}`)
        .join('\n');
      const activeEmbed = new EmbedBuilder()
        .setTitle('💬 Most Active Chatters')
        .setDescription(leaderboard)
        .setColor(0xe74c3c);
      await interaction.reply({ embeds: [activeEmbed] });
      break;
    }
    case "fbi": {
      await interaction.deferReply();
      try {
        const search = interaction.options.getString("search");
        const randomPage = Math.ceil(Math.random() * 8);
        const apiUrl = search
          ? `https://api.fbi.gov/wanted/v1/list?title=${encodeURIComponent(search)}&pageSize=10`
          : `https://api.fbi.gov/wanted/v1/list?pageSize=20&page=${randomPage}`;

        const res = await axios.get(apiUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        });
        const items = res.data.items;

        if (!items || !items.length) {
          return interaction.editReply(search ? `No results found for **${search}**.` : 'Could not fetch the wanted list.');
        }

        const person = search ? items[0] : items[Math.floor(Math.random() * items.length)];

        const embed = new EmbedBuilder()
          .setTitle('🔴  FBI MOST WANTED')
          .setDescription(`## ${person.title}`)
          .setColor(0xcc0000)
          .setURL(person.url || 'https://www.fbi.gov/wanted');

        // www.fbi.gov blocks datacenter IPs via Cloudflare — proxy through images.weserv.nl
        let photoAttachment = null;
        const rawImgUrl = person.images?.[0]?.large || person.images?.[0]?.original || person.images?.[0]?.thumb;
        if (rawImgUrl) {
          try {
            const proxied = `https://images.weserv.nl/?url=${encodeURIComponent(rawImgUrl.replace('https://', ''))}`;
            const imgRes = await axios.get(proxied, { responseType: 'arraybuffer', timeout: 10000 });
            photoAttachment = new AttachmentBuilder(Buffer.from(imgRes.data), { name: 'wanted.jpg' });
            embed.setImage('attachment://wanted.jpg');
          } catch (photoErr) {
            console.error('FBI photo error:', photoErr.message);
          }
        }

        if (person.subjects?.length) {
          embed.addFields({ name: '⚖️ Wanted For', value: person.subjects.join(', '), inline: false });
        }

        if (person.reward_text) {
          embed.addFields({ name: '💰 Reward', value: person.reward_text, inline: true });
        } else if (person.reward_max > 0) {
          embed.addFields({ name: '💰 Reward', value: `Up to $${person.reward_max.toLocaleString()}`, inline: true });
        }

        if (person.aliases?.length) {
          embed.addFields({ name: '🎭 Also Known As', value: person.aliases.join(', ').substring(0, 256), inline: false });
        }

        const phys = [];
        if (person.sex)         phys.push(`**Sex:** ${person.sex}`);
        if (person.race_raw)    phys.push(`**Race:** ${person.race_raw}`);
        if (person.age_range)   phys.push(`**Age:** ${person.age_range}`);
        if (person.height_min)  { const ft = Math.floor(person.height_min / 12); phys.push(`**Height:** ${ft}'${person.height_min % 12}"`); }
        if (person.weight)      phys.push(`**Weight:** ${person.weight}`);
        if (person.hair_raw)    phys.push(`**Hair:** ${person.hair_raw}`);
        if (person.eyes_raw)    phys.push(`**Eyes:** ${person.eyes_raw}`);
        if (phys.length) embed.addFields({ name: '👤 Physical', value: phys.join('  •  '), inline: false });

        const desc = person.description?.replace(/<[^>]*>/g, '').trim();
        if (desc) embed.addFields({ name: '📋 Details', value: desc.substring(0, 1024), inline: false });

        const caution = person.caution?.replace(/<[^>]*>/g, '').trim();
        if (caution) embed.addFields({ name: '⚠️ Caution', value: caution.length > 1020 ? caution.substring(0, 1020) + '…' : caution, inline: false });

        embed.setFooter({ text: 'Source: FBI Most Wanted API  •  tips.fbi.gov  •  1-800-CALL-FBI' });
        const replyPayload = { embeds: [embed] };
        if (photoAttachment) replyPayload.files = [photoAttachment];
        await interaction.editReply(replyPayload);
      } catch (err) {
        console.error('FBI error:', err.message);
        await interaction.editReply('Failed to fetch FBI data.');
      }
      break;
    }

    case "gpsjam": {
      if (!isFeatureEnabled("gpsjam")) return interaction.reply({ content: '❌ This feature is currently disabled.', ephemeral: true });
      await interaction.deferReply();
      try {
        let h3 = null;
        try { h3 = require('h3-js'); } catch (_) {}
        if (!h3) return interaction.editReply('`h3-js` package not found. Run `npm install h3-js` in the bot directory.');
        if (!config.mapboxToken) return interaction.editReply('`mapboxToken` required in config.');

        // Get latest non-suspect date from manifest
        const manifestRes = await axios.get('https://gpsjam.org/data/manifest.csv', { timeout: 10000, decompress: true });
        const manifestLines = manifestRes.data.trim().split('\n').slice(1);
        const latestDate = manifestLines
          .map(l => l.split(','))
          .filter(p => p[1]?.trim() !== 'true')
          .map(p => p[0].trim())
          .at(-1);

        if (!latestDate) return interaction.editReply('Could not determine latest GPSJam data date.');

        // Fetch daily H3 CSV (gzip compressed)
        const dataRes = await axios.get(`https://gpsjam.org/data/${latestDate}-h3_4.csv`, {
          timeout: 30000,
          decompress: true,
        });

        // Parse CSV and compute interference ratio per hex cell
        const lines = dataRes.data.trim().split('\n').slice(1);
        const jamPoints = [];
        for (const line of lines) {
          const [hex, good, bad] = line.split(',');
          const badN = parseInt(bad), goodN = parseInt(good);
          if (badN < 1) continue;
          const ratio = (badN - 1) / (badN + goodN);
          if (ratio < 0.02) continue;
          const [lat, lon] = h3.cellToLatLng(hex);
          jamPoints.push({ lat, lon, ratio });
        }

        // Fetch dark basemap — global view
        const zoom = 1, centerLat = 30, centerLon = 25, W = 900, H = 550;
        const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${centerLon},${centerLat},${zoom}/${W}x${H}?access_token=${config.mapboxToken}`;
        const mapRes = await axios.get(mapUrl, { responseType: 'arraybuffer', timeout: 20000 });

        const rawBuf = Buffer.from(mapRes.data);
        const image = await (typeof Jimp.fromBuffer === 'function' ? Jimp.fromBuffer(rawBuf) : Jimp.read(rawBuf));

        // Web Mercator projection (same as radar)
        const worldPx = 512 * Math.pow(2, zoom);
        const lonToWx = l => (l + 180) / 360 * worldPx;
        const latToWy = l => { const r = l * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * worldPx; };
        const cWx = lonToWx(centerLon), cWy = latToWy(centerLat);
        const toPixel = (lon, lat) => ({ x: Math.round(lonToWx(lon) - cWx + W / 2), y: Math.round(latToWy(lat) - cWy + H / 2) });

        const setPixel = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) image.setPixelColor(c, x, y); };
        const drawDot = (cx, cy, c, r) => {
          for (let dx = -r; dx <= r; dx++)
            for (let dy = -r; dy <= r; dy++)
              if (dx * dx + dy * dy <= r * r) setPixel(cx + dx, cy + dy, c);
        };

        // Render lowest interference first so severe spots render on top
        jamPoints.sort((a, b) => a.ratio - b.ratio);
        for (const { lat, lon, ratio } of jamPoints) {
          const { x, y } = toPixel(lon, lat);
          const color = ratio > 0.5 ? 0xff2222ff   // red    — severe
                      : ratio > 0.2 ? 0xff8800ff   // orange — high
                      : ratio > 0.1 ? 0xffdd00ff   // yellow — medium
                      :               0x44ff88ff;  // green  — low
          drawDot(x, y, color, 3);
        }

        const outBuf = typeof image.getBufferAsync === 'function'
          ? await image.getBufferAsync('image/png')
          : await image.getBuffer('image/png');

        const severeCount  = jamPoints.filter(p => p.ratio > 0.5).length;
        const highCount    = jamPoints.filter(p => p.ratio > 0.2 && p.ratio <= 0.5).length;

        const embed = new EmbedBuilder()
          .setTitle('📡 Real-Time GPS Jamming Map')
          .setDescription(`Global GPS interference data for **${latestDate}**`)
          .setColor(0xff4400)
          .addFields(
            { name: '🔴 Severe (>50%)', value: `${severeCount.toLocaleString()} zones`, inline: true },
            { name: '🟠 High (20–50%)', value: `${highCount.toLocaleString()} zones`,  inline: true },
            { name: '📊 Total affected', value: `${jamPoints.length.toLocaleString()} zones`, inline: true },
          )
          .setImage('attachment://gpsjam.png')
          .setFooter({ text: 'Source: GPSJam.org • ADS-B derived  •  🟢 2% 🟡 10% 🟠 20% 🔴 50%+' });

        await interaction.editReply({ embeds: [embed], files: [new AttachmentBuilder(outBuf, { name: 'gpsjam.png' })] });
      } catch (err) {
        console.error('GPSJam error:', err.message);
        await interaction.editReply('Failed to fetch GPS jamming data: ' + err.message);
      }
      break;
    }

    case "whosflying": {
      await interaction.deferReply();

      // Airport coord cache — persists across refreshes so we don't re-fetch unchanged routes
      const airportCache = {};
      const lookupAirports = async (...icaos) => {
        const missing = icaos.filter(id => id && id !== '???' && !airportCache[id]);
        if (!missing.length) return;
        try {
          const res = await axios.get(
            `https://aviationweather.gov/api/data/airport?ids=${missing.join(',')}&format=json`,
            { timeout: 8000 }
          );
          for (const ap of (res.data || [])) airportCache[ap.icaoId] = { lat: ap.lat, lon: ap.lon };
        } catch (_) {}
      };

      // ---- Fetch current flights ----
      const fetchFlying = async () => {
        const flying = [];

        if (config.volantaUsers?.length) {
          try {
            const feedRes = await axios.get('https://webassets.volanta.app/volanta-flight-positions.json', { timeout: 10000 });
            const feedEntries = feedRes.data?.data || [];
            for (const user of config.volantaUsers) {
              const entry = feedEntries.find(e => e.networkUserId === user.userId && e.privacyOption !== 'Private');
              if (!entry) continue;
              await lookupAirports(entry.originIcao, entry.destinationIcao);
              const originCoords = airportCache[entry.originIcao] || null;
              const destCoords   = airportCache[entry.destinationIcao] || null;
              flying.push({ source: 'volanta', user, entry, originCoords, destCoords });
            }
          } catch (_) {}
        }

        if (config.vatsimUsers?.length) {
          try {
            const vRes = await axios.get('https://data.vatsim.net/v3/vatsim-data.json', { timeout: 15000 });
            const vPilots = vRes.data?.pilots || [];
            for (const vu of config.vatsimUsers) {
              const pilot = vPilots.find(p => String(p.cid) === String(vu.cid));
              if (!pilot) continue;
              await lookupAirports(pilot.flight_plan?.departure, pilot.flight_plan?.arrival);
              const originCoords = airportCache[pilot.flight_plan?.departure] || null;
              const destCoords   = airportCache[pilot.flight_plan?.arrival]   || null;
              flying.push({ source: 'vatsim', user: vu, pilot, originCoords, destCoords });
            }
          } catch (_) {}
        }

        return flying;
      };

      // ---- Jimp map builder ----
      const buildFlightMap = async (mapPoints, routeSegs, W = 900, H = 450) => {
        const lats = mapPoints.map(p => p.lat);
        const lons = mapPoints.map(p => p.lon);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLon = Math.min(...lons), maxLon = Math.max(...lons);
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;

        const PADDING = 90;
        let zoom = 1;
        for (let z = 10; z >= 1; z--) {
          const wPx = 512 * Math.pow(2, z);
          const lToWx = l => (l + 180) / 360 * wPx;
          const lToWy = l => { const r = l * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * wPx; };
          const cWx = lToWx(centerLon), cWy = lToWy(centerLat);
          const xs = lons.map(l => lToWx(l) - cWx + W / 2);
          const ys = lats.map(l => lToWy(l) - cWy + H / 2);
          if (Math.min(...xs) >= PADDING && Math.max(...xs) <= W - PADDING &&
              Math.min(...ys) >= PADDING && Math.max(...ys) <= H - PADDING) {
            zoom = z; break;
          }
        }

        const basemapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${centerLon.toFixed(4)},${centerLat.toFixed(4)},${zoom}/${W}x${H}?access_token=${config.mapboxToken}`;
        const basemapRes = await axios.get(basemapUrl, { responseType: 'arraybuffer', timeout: 20000 });
        const image = await (typeof Jimp.fromBuffer === 'function' ? Jimp.fromBuffer(Buffer.from(basemapRes.data)) : Jimp.read(Buffer.from(basemapRes.data)));

        const worldPx = 512 * Math.pow(2, zoom);
        const lonToWx = l => (l + 180) / 360 * worldPx;
        const latToWy = l => { const r = l * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * worldPx; };
        const cWx = lonToWx(centerLon), cWy = latToWy(centerLat);
        const toPixel = (lon, lat) => ({ x: Math.round(lonToWx(lon) - cWx + W / 2), y: Math.round(latToWy(lat) - cWy + H / 2) });
        const setPixel = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) image.setPixelColor(c, x, y); };

        const drawLine = (x0, y0, x1, y1, c, width = 2) => {
          x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
          const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
          const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
          let err = dx - dy, x = x0, y = y0;
          const hw = Math.floor(width / 2);
          while (true) {
            for (let w = -hw; w <= hw; w++) {
              if (dy >= dx) setPixel(x + w, y, c); else setPixel(x, y + w, c);
            }
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx)  { err += dx; y += sy; }
          }
        };

        const drawDashedLine = (x0, y0, x1, y1, c, dashLen = 10, gapLen = 5) => {
          const dx = x1 - x0, dy = y1 - y0;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return;
          const ux = dx / dist, uy = dy / dist;
          let d = 0, on = true, seg = 0;
          while (d <= dist) {
            if (on) {
              const px = Math.round(x0 + ux * d), py = Math.round(y0 + uy * d);
              for (let w = -1; w <= 1; w++) {
                if (Math.abs(dy) >= Math.abs(dx)) setPixel(px + w, py, c); else setPixel(px, py + w, c);
              }
            }
            d += 1; seg++;
            if (on  && seg >= dashLen) { on = false; seg = 0; }
            else if (!on && seg >= gapLen)  { on = true;  seg = 0; }
          }
        };

        const drawDot = (cx, cy, c, r) => {
          for (let dx = -r; dx <= r; dx++)
            for (let dy = -r; dy <= r; dy++)
              if (dx * dx + dy * dy <= r * r) setPixel(cx + dx, cy + dy, c);
        };

        const fillTriangle = (p1, p2, p3, c) => {
          const pts = [p1, p2, p3].sort((a, b) => a[1] - b[1]);
          const [[x0, y0], [x1, y1], [x2, y2]] = pts;
          for (let y = Math.floor(y0); y <= Math.ceil(y2); y++) {
            const xLong  = y0 === y2 ? x0 : x0 + (y - y0) / (y2 - y0) * (x2 - x0);
            const xShort = y <= y1
              ? (y0 === y1 ? x0 : x0 + (y - y0) / (y1 - y0) * (x1 - x0))
              : (y1 === y2 ? x1 : x1 + (y - y1) / (y2 - y1) * (x2 - x1));
            for (let x = Math.floor(Math.min(xLong, xShort)); x <= Math.ceil(Math.max(xLong, xShort)); x++)
              setPixel(x, y, c);
          }
        };

        const drawPlane = (cx, cy, headingDeg, c) => {
          const ang = headingDeg * Math.PI / 180;
          const fX = Math.sin(ang), fY = -Math.cos(ang);
          const rX = Math.cos(ang), rY =  Math.sin(ang);
          const pt = (f, r) => [Math.round(cx + fX * f + rX * r), Math.round(cy + fY * f + rY * r)];
          fillTriangle(pt(17, 0), pt(-5, -15), pt(-5, 15), c);
          fillTriangle(pt(-5, 0), pt(-15, -8), pt(-15, 8), c);
        };

        for (const seg of routeSegs) {
          for (let i = 0; i < seg.points.length - 1; i++) {
            const a = toPixel(seg.points[i].lon, seg.points[i].lat);
            const b = toPixel(seg.points[i + 1].lon, seg.points[i + 1].lat);
            if (seg.dashed) drawDashedLine(a.x, a.y, b.x, b.y, seg.color, 12, 6);
            else            drawLine(a.x, a.y, b.x, b.y, seg.color, seg.width || 2);
          }
        }

        for (const p of mapPoints) {
          const { x, y } = toPixel(p.lon, p.lat);
          if (p.role === 'origin') {
            drawDot(x, y, 0x00cc44ff, 7); drawDot(x, y, 0xffffffff, 3);
          } else if (p.role === 'dest') {
            drawDot(x, y, 0xff4444ff, 7); drawDot(x, y, 0xffffffff, 3);
          } else if (p.role === 'plane') {
            drawPlane(x + 1, y + 1, p.heading, 0x00000099);
            drawPlane(x, y, p.heading, p.color);
          }
        }

        return image.getBuffer('image/png');
      };

      // ---- Build embed pages from flight data ----
      const buildPages = async (flying) => {
        const updatedAt = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const pages = [];

        for (const entry of flying) {
          let embed, imgBuf = null;

          if (entry.source === 'volanta') {
            const { user, entry: fe, originCoords, destCoords } = entry;
            const pos      = fe.position || {};
            const origin   = fe.originIcao || '???';
            const dest     = fe.destinationIcao || '???';
            const aircraft = fe.aircraftIcao || 'Unknown';
            const callsign = fe.callsign || fe.flightNumber || '-';
            const altFt    = pos.altitude     != null ? `${Math.round(pos.altitude).toLocaleString()} ft` : 'Unknown';
            const speedKt  = pos.groundSpeed  != null ? `${Math.round(pos.groundSpeed)} kt` : 'Unknown';
            const heading  = pos.headingTrue  != null ? `${Math.round(pos.headingTrue)}°` : 'Unknown';
            const vsStr    = pos.verticalSpeed != null ? ` (${pos.verticalSpeed >= 0 ? '+' : ''}${Math.round(pos.verticalSpeed)} fpm)` : '';
            embed = new EmbedBuilder()
              .setTitle(`✈️ ${user.username} is flying!`)
              .setColor(0x00bfff)
              .setURL(`https://fly.volanta.app/profile/${user.username}/flights`)
              .addFields(
                { name: '🛫 Route', value: `**${origin}** → **${dest}**`, inline: false },
                { name: '✈️ Aircraft', value: aircraft, inline: true },
                { name: '📟 Callsign', value: callsign, inline: true },
                { name: '🏔️ Altitude', value: `${altFt}${vsStr}`, inline: true },
                { name: '💨 Speed', value: speedKt, inline: true },
                { name: '🧭 Heading', value: heading, inline: true },
              )
              .setTimestamp()
              .setFooter({ text: `Source: Volanta • Updated ${updatedAt}` });

            if (Jimp && pos.latitude != null && pos.longitude != null && config.mapboxToken) {
              try {
                const mapPoints = [], flownSeg = [], remainSeg = [];
                if (originCoords) { mapPoints.push({ ...originCoords, role: 'origin' }); flownSeg.push({ points: [originCoords, { lat: pos.latitude, lon: pos.longitude }], color: 0x4499ccff, width: 2 }); }
                if (destCoords)   { mapPoints.push({ ...destCoords,   role: 'dest'   }); remainSeg.push({ points: [{ lat: pos.latitude, lon: pos.longitude }, destCoords], color: 0x334455ff, width: 2, dashed: true }); }
                mapPoints.push({ lat: pos.latitude, lon: pos.longitude, role: 'plane', heading: pos.headingTrue || 0, color: 0x00bfffff });
                imgBuf = await buildFlightMap(mapPoints, [...flownSeg, ...remainSeg]);
                embed.setImage('attachment://flightmap.png');
              } catch (_) {}
            }

          } else if (entry.source === 'vatsim') {
            const { user, pilot, originCoords, destCoords } = entry;
            const fp       = pilot.flight_plan;
            const origin   = fp?.departure || '???';
            const dest     = fp?.arrival   || '???';
            const aircraft = fp?.aircraft_short || fp?.aircraft || 'Unknown';
            const callsign = pilot.callsign || '-';
            const elapsed  = Math.floor((Date.now() - new Date(pilot.logon_time).getTime()) / 1000);
            const timeOnline = `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
            const altFt    = pilot.altitude    != null ? `${pilot.altitude.toLocaleString()} ft` : 'Unknown';
            const speedKt  = pilot.groundspeed != null ? `${pilot.groundspeed} kt` : 'Unknown';
            const heading  = pilot.heading     != null ? `${pilot.heading}°` : 'Unknown';
            embed = new EmbedBuilder()
              .setTitle(`✈️ ${user.username} is flying on VATSIM!`)
              .setColor(0x7289da)
              .setURL(`https://stats.vatsim.net/stats/${user.cid}`)
              .addFields(
                { name: '🛫 Route', value: `**${origin}** → **${dest}**`, inline: false },
                { name: '✈️ Aircraft', value: aircraft, inline: true },
                { name: '📟 Callsign', value: callsign, inline: true },
                { name: '⏱️ Online', value: timeOnline, inline: true },
                { name: '🏔️ Altitude', value: altFt, inline: true },
                { name: '💨 Speed', value: speedKt, inline: true },
                { name: '🧭 Heading', value: heading, inline: true },
              )
              .setTimestamp()
              .setFooter({ text: `Source: VATSIM • CID: ${user.cid} • Updated ${updatedAt}` });

            if (Jimp && pilot.latitude != null && pilot.longitude != null && config.mapboxToken) {
              try {
                const mapPoints = [], flownSeg = [], remainSeg = [];
                if (originCoords) {
                  mapPoints.push({ ...originCoords, role: 'origin' });
                  flownSeg.push({ points: [originCoords, { lat: pilot.latitude, lon: pilot.longitude }], color: 0x7289daff, width: 2 });
                }
                if (destCoords) {
                  mapPoints.push({ ...destCoords, role: 'dest' });
                  remainSeg.push({ points: [{ lat: pilot.latitude, lon: pilot.longitude }, destCoords], color: 0x334466ff, width: 2, dashed: true });
                }
                mapPoints.push({ lat: pilot.latitude, lon: pilot.longitude, role: 'plane', heading: pilot.heading || 0, color: 0x7289daff });
                imgBuf = await buildFlightMap(mapPoints, [...flownSeg, ...remainSeg]);
                embed.setImage('attachment://flightmap.png');
              } catch (_) {}
            }
          }

          if (embed) pages.push({ embed, imgBuf });
        }

        return pages;
      };

      // ---- Page display helpers ----
      const makeRow = (page, total) => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('wf_prev').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('wf_page').setLabel(`${page + 1} / ${total}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('wf_next').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(page === total - 1),
      );

      const makeOpts = (page, pages) => {
        const { embed, imgBuf } = pages[page];
        const components = pages.length > 1 ? [makeRow(page, pages.length)] : [];
        return { embeds: [embed], components, ...(imgBuf && { files: [new AttachmentBuilder(imgBuf, { name: 'flightmap.png' })] }) };
      };

      // ---- Initial fetch ----
      let flying = await fetchFlying();
      if (!flying.length) return interaction.editReply('Nobody is currently flying.');

      let pages = await buildPages(flying);
      if (!pages.length) return interaction.editReply('Nobody is currently flying.');

      let currentPage = 0;
      let busy = false;

      await interaction.editReply(makeOpts(currentPage, pages));

      // ---- Pagination collector (3 min lifetime matches refresh window) ----
      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => ['wf_prev', 'wf_next'].includes(i.customId) && i.message.interaction?.id === interaction.id,
        time: 3 * 60 * 1000,
      });
      collector.on('collect', async i => {
        if (i.customId === 'wf_prev') currentPage = Math.max(0, currentPage - 1);
        if (i.customId === 'wf_next') currentPage = Math.min(pages.length - 1, currentPage + 1);
        await i.update(makeOpts(currentPage, pages)).catch(() => {});
      });

      // ---- Auto-refresh every 10s for 3 minutes ----
      const refreshTimer = setInterval(async () => {
        if (busy) return;
        busy = true;
        try {
          const newFlying = await fetchFlying();
          if (!newFlying.length) {
            clearInterval(refreshTimer);
            collector.stop('nobody');
            await interaction.editReply({ content: 'Nobody is currently flying.', embeds: [], components: [], files: [] });
            return;
          }
          pages = await buildPages(newFlying);
          currentPage = Math.min(currentPage, pages.length - 1);
          await interaction.editReply(makeOpts(currentPage, pages));
        } catch (_) {}
        busy = false;
      }, 10_000);

      // Stop refreshing after 3 minutes
      setTimeout(() => clearInterval(refreshTimer), 3 * 60 * 1000);

      collector.on('end', (_, reason) => {
        clearInterval(refreshTimer);
        if (reason !== 'nobody') {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });

      break;
    }


    default:
      await interaction.reply({ content: "Unknown command.", ephemeral: true });
      break;
  }
});

// ====== Auto-remove timeout on owner ======
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (newMember.user.id !== config.ownerId) return;
  const wasTimedOut = !oldMember.isCommunicationDisabled();
  const isNowTimedOut = newMember.isCommunicationDisabled();
  if (wasTimedOut && isNowTimedOut) {
    if (!autoRemoveTimeoutEnabled) return; // protection is off
    if (rouletteTimeoutActive) return; // roulette applied this timeout — leave it
    try {
      await newMember.timeout(null, 'Auto-removed: owner timeout protection');
      console.log('Auto-removed timeout on owner');
    } catch (e) {
      console.error('Failed to auto-remove owner timeout:', e.message);
    }
  }
});

// ====== DM Handler ======
let storyMessages = [];
let lastAuthorId = null;

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Track message counts (guild messages only)
  if (message.guild) {
    const key = message.author.id;
    if (!messageCounts[key]) messageCounts[key] = { username: message.author.username, count: 0 };
    messageCounts[key].count++;
    messageCounts[key].username = message.author.username;
    if (messageCounts[key].count % 10 === 0) saveMessageCounts();
  }

  // Owner DM Command Handler
  if (message.channel.type === ChannelType.DM && message.author.id === config.ownerId) {
      const command = message.content.trim().toLowerCase();
      const content = message.content.trim();

      // --- TEXT TIMEOUT OVERRIDE ---
      if (command === '!removetimeout me') {
          let foundAndRemoved = false;
          let foundInServer;
          for (const guild of client.guilds.cache.values()) {
              const member = await guild.members.fetch(config.ownerId).catch(() => null);
              if (member && member.communicationDisabledUntilTimestamp > Date.now()) {
                  foundInServer = guild.name;
                  try {
                      await member.timeout(null, "Owner override via DM.");
                      foundAndRemoved = true;
                      break;
                  } catch (error) {
                      console.error(`Failed to remove timeout for owner in ${guild.name}:`, error);
                      await message.author.send(`I found you were timed out in **${guild.name}**, but I failed to remove it. I might be missing the 'Moderate Members' permission there.`);
                      return;
                  }
              }
          }
          if (foundAndRemoved) {
              await message.author.send(`Your timeout in **${foundInServer}** has been successfully removed.`);
          } else {
              await message.author.send("I searched all our shared servers, but I couldn't find an active timeout for you.");
          }
          return;
      }

      // --- VOICE MUTE OVERRIDE ---
      if (command === '!unmute me') {
          let ownerMember;
          for (const guild of client.guilds.cache.values()) {
              const member = await guild.members.fetch(config.ownerId).catch(() => null);
              if (member && member.voice.channel) {
                  ownerMember = member;
                  break;
              }
          }

          if (ownerMember && ownerMember.voice.channel) {
              try {
                  await ownerMember.voice.setMute(false, "Owner override via DM.");
                  await message.author.send("You have been successfully unmuted.");
              } catch (error) {
                  console.error("Failed to unmute owner via DM command:", error);
                  await message.author.send("I tried to unmute you, but encountered an error. I might not have the right permissions in that channel.");
              }
          } else {
              await message.author.send("I couldn't find you in any voice channels across our shared servers.");
          }
          return;
      }

      // --- RELAY DM TO CHANNEL ---
      if (content.startsWith('>')) {
          const messageToSend = content.substring(1).trim();
          if (messageToSend.length === 0) {
               await message.author.send("You need to provide a message after the `>` prefix.");
               return;
          }
          if (!config.relayServerId || !config.relayChannelId) {
               await message.author.send("Relay Server ID or Channel ID is not configured in the bot script.");
               return;
          }

          try {
              const targetGuild = await client.guilds.fetch(config.relayServerId);
              const targetChannel = await targetGuild.channels.fetch(config.relayChannelId);

              if (targetChannel && targetChannel.isTextBased()) {
                  await targetChannel.send(messageToSend);
                  await message.react('✅');
              } else {
                  await message.author.send("Could not find the target relay channel or it's not a text channel.");
              }
          } catch (error) {
              console.error("Failed to relay DM:", error);
              await message.author.send("Failed to send your message to the channel. Please check the Server/Channel IDs and my permissions.");
          }
          return;
      }
  }

  // --- Story Moderator ---
  if (message.channel.id === config.storyChannelId) {
    const guildSettings = getGuildSettings(message.guild.id);
    const storyLength = guildSettings.storyLength;

    const storyPermissions = permissions.features.story;
    if (!storyPermissions.enabled || (storyPermissions.restrictedUsers && storyPermissions.restrictedUsers.includes(message.author.id))) {
      await message.delete().catch(console.error);
      try { await message.author.send("You are not allowed to participate in the story channel."); }
      catch (e) { console.error(`Could not DM story-restricted user ${message.author.id}:`, e); }
      return;
    }

    if (message.author.id === lastAuthorId) {
      await message.delete().catch(console.error);
      try { await message.author.send("You must wait for someone else to post before adding another line to the story."); }
      catch (e) { console.error(`Could not DM user ${message.author.id} about story turns:`, e); }
      return;
    }
    storyMessages.push(message);
    lastAuthorId = message.author.id;
    if (storyMessages.length >= storyLength) {
      const paragraph = storyMessages.map(m => m.content).join("\n");
      try { await message.channel.bulkDelete(storyMessages.slice(0, 100), true); }
      catch (e) { console.error("Error bulk deleting story messages:", e); }
      storyMessages = [];
      lastAuthorId = null;
      await message.channel.send(`**Here's your story:**\n${paragraph}\n\n*Start a new story below!*`);
    }
  }
});

// ====== Restart Bot ======
const restartBot = async (interaction) => {
  if (!hasPermission(interaction, config.ownerId)) return;
  try {
    fs.writeFileSync(restartFile, JSON.stringify({ interactionId: interaction.id, channelId: interaction.channelId, userId: interaction.user.id }), "utf8");
    await interaction.reply({ content: "Restarting bot...", ephemeral: true });
    setTimeout(() => process.exit(0), 3000);
  } catch (error) {
    console.error("Failed to restart bot:", error);
    await interaction.reply({ content: "Failed to restart bot.", ephemeral: true });
  }
};

// ====== Auto Purge (daily 4:30am UTC) ======
function scheduleAutoPurge(client) {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(4, 30, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const delay = next - now;
  setTimeout(async () => {
    try {
      const guild = client.guilds.cache.first();
      if (!guild) return;

      const channels = guild.channels.cache.filter(c => c.isTextBased() && c.viewable && !c.isThread());
      let deleted = 0;

      // Only look at messages from the last 24 hours using Discord snowflake IDs
      const DISCORD_EPOCH = 1420070400000n;
      const cutoff = BigInt(Date.now() - 24 * 60 * 60 * 1000);
      const afterSnowflake = ((cutoff - DISCORD_EPOCH) << 22n).toString();

      for (const [, ch] of channels) {
        let afterId = afterSnowflake;
        while (true) {
          let fetched;
          try { fetched = await ch.messages.fetch({ limit: 100, after: afterId }); } catch { break; }
          if (!fetched.size) break;
          // after= returns ascending order; advance cursor to last message
          afterId = [...fetched.keys()].sort().at(-1);
          const botMsgs = fetched.filter(m => m.author.id === client.user.id);
          if (botMsgs.size > 0) {
            try {
              const result = await ch.bulkDelete(botMsgs, true);
              deleted += result.size;
            } catch {
              for (const msg of botMsgs.values()) {
                try { await msg.delete(); deleted++; } catch {}
              }
            }
          }
          if (fetched.size < 100) break;
        }
      }

      console.log(`Auto-purge complete: deleted ${deleted} bot messages.`);
    } catch (e) {
      console.error('Auto-purge error:', e.message);
    }

    scheduleAutoPurge(client); // schedule next day
  }, delay);

  const nextStr = next.toUTCString();
  console.log(`Auto-purge scheduled for ${nextStr}`);
}

// ====== Status / Purge ======
async function postSpasticResults(client) {
  const today = new Date().toISOString().slice(0, 10);
  const announceDate = spasticVotes.date || today;
  if (Object.keys(spasticVotes.votes).length === 0) return;
  const counts = {};
  const reasons = {};
  for (const vote of Object.values(spasticVotes.votes)) {
    const votedId = typeof vote === 'string' ? vote : vote.id;
    const reason = typeof vote === 'object' ? vote.reason : null;
    counts[votedId] = (counts[votedId] || 0) + 1;
    if (reason) { if (!reasons[votedId]) reasons[votedId] = []; reasons[votedId].push(reason); }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [winnerId, winCount] = sorted[0];
  if (!spasticWins[winnerId]) spasticWins[winnerId] = 0;
  spasticWins[winnerId]++;
  saveSpasticWins();
  const totalVoters = Object.keys(spasticVotes.votes).length;
  spasticVotes = { date: today, votes: {} };
  saveSpasticVotes();
  const medals = ['🥇', '🥈', '🥉'];
  const lines = sorted.map(([id, n], i) => {
    const reasonList = reasons[id] ? '\n> ' + reasons[id].join('\n> ') : '';
    return `${medals[i] || `${i+1}.`} <@${id}> — **${n} vote${n === 1 ? '' : 's'}**${reasonList}`;
  }).join('\n');
  const embed = new EmbedBuilder()
    .setTitle(`🤡 Spastic of the Day — ${announceDate}`)
    .setDescription(lines)
    .setColor(0xFF6B35)
    .setFooter({ text: `${totalVoters} ${totalVoters === 1 ? 'person' : 'people'} voted today` });
  try {
    const guild = await client.guilds.fetch(config.relayServerId);
    const channel = await guild.channels.fetch(config.relayChannelId);
    await channel.send({ content: `🏆 **Spastic of the Day** is <@${winnerId}>!`, embeds: [embed] });
  } catch (e) { console.error('[Spastic] Failed to post results:', e.message); }
}

function scheduleSpasticResults(client) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const londonNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
  const londonTarget = new Date(londonNow);
  londonTarget.setHours(20, 0, 0, 0);
  if (londonNow >= londonTarget) londonTarget.setDate(londonTarget.getDate() + 1);
  const msUntil = londonTarget - londonNow;
  setTimeout(async () => {
    await postSpasticResults(client);
    scheduleSpasticResults(client);
  }, msUntil);
  console.log(`[Spastic] Results scheduled in ${Math.round(msUntil/60000)}m`);
}

const FEATURE_LABELS = {
  ask: 'Ask (AI questions)', story: 'Story', spastic: 'Spastic of the Day',
  trivia: 'Trivia', '8ball': '8 Ball', roulette: 'Roulette', geoguessr: 'GeoGuessr',
  mood: 'Mood Analysis', gpsjam: 'GPS Jam', radar: 'Radar', random_messages: 'Random Messages',
};

const handleFeature = async (interaction) => {
  if (interaction.user.id !== config.ownerId) {
    return interaction.reply({ content: 'Only the owner can manage features.', ephemeral: true });
  }
  const sub = interaction.options.getSubcommand();
  if (sub === 'toggle') {
    const name = interaction.options.getString('name');
    if (!permissions.features[name]) permissions.features[name] = { enabled: true };
    permissions.features[name].enabled = !permissions.features[name].enabled;
    savePermissions();
    const state = permissions.features[name].enabled ? '✅ Enabled' : '❌ Disabled';
    return interaction.reply({ content: `**${FEATURE_LABELS[name] || name}** — ${state}`, ephemeral: true });
  }
  if (sub === 'list') {
    const lines = Object.entries(FEATURE_LABELS).map(([key, label]) => {
      const on = isFeatureEnabled(key);
      return `${on ? '✅' : '❌'} ${label}`;
    });
    return interaction.reply({ content: lines.join('\n'), ephemeral: true });
  }
};

const handleSpastic = async (interaction) => {
  const sub = interaction.options.getSubcommand();
  const today = new Date().toISOString().slice(0, 10);

  if (spasticVotes.date !== today) {
    spasticVotes = { date: today, votes: {} };
  }

  if (sub === 'vote') {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "You can't vote for yourself.", ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: "Bots can't be Spastic of the Day.", ephemeral: true });
    }
    const reason = interaction.options.getString('reason') || null;
    const already = spasticVotes.votes[interaction.user.id];
    spasticVotes.votes[interaction.user.id] = { id: target.id, reason };
    saveSpasticVotes();
    const action = already ? 'changed their vote' : 'voted';
    await interaction.reply({ content: '✅ Vote recorded!', ephemeral: true });
    await interaction.channel.send(`🗳️ **${interaction.user.username}** ${action} for Spastic of the Day!`);
    return;

  } else if (sub === 'leaderboard') {
    const entries = Object.entries(spasticWins).filter(([, n]) => n > 0);
    if (entries.length === 0) {
      return interaction.reply({ content: 'No winners yet!' });
    }
    const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const lines = sorted.map(([id, n], i) =>
      `${medals[i] || `**${i+1}.**`} <@${id}> — **${n} day${n === 1 ? '' : 's'}**`
    ).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('🤡 Spastic of the Day — All-Time Leaderboard')
      .setDescription(lines)
      .setColor(0xFF6B35)
      .setFooter({ text: 'Number of days voted #1' });
    return interaction.reply({ embeds: [embed] });
  }
};

const getStatus = async (interaction) => {
  exec("pm2 jlist", async (err, stdout, stderr) => {
    if (err || stderr) {
      console.error("Error fetching status:", err || stderr);
      return interaction.editReply("Error fetching server status.");
    }
    try {
      const processes = JSON.parse(stdout);
      if (!processes.length) return interaction.editReply("No running processes found.");
      const statusMessage = processes
        .map((proc) => {
          let displayName = proc.name;
          const nameMapping = { "steam-hour-farmer": "Script", "discord-bot": "Discord Bot" };
          displayName = nameMapping[displayName] || displayName;
          let status = proc.pm2_env.status;
          let uptimeMs = proc.pm2_env.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0;
          let uptime = uptimeMs > 0 ? new Date(uptimeMs).toISOString().substr(11, 8) : "0s";
          return `${displayName} - Status: ${status} - Uptime: ${uptime}`;
        })
        .join("\n");
      const usageMonth = googleUsage.month || 'N/A';
      const usageCount = googleUsage.count || 0;
      await interaction.editReply(`\`\`\`${statusMessage}\`\`\`\n📊 Google API: ${usageCount}/${GOOGLE_MONTHLY_LIMIT} requests this month (${usageMonth})`);
    } catch (error) {
      console.error("Error parsing status:", error);
      await interaction.editReply("Error parsing server status.");
    }
  });
};

const purgeMessages = async (interaction) => {
  if (!hasPermission(interaction, config.ownerId)) return;
  await interaction.deferReply({ ephemeral: true });

  const target = interaction.options.getString('target');
  const targetId = target === 'bot' ? client.user.id : interaction.user.id;
  const label = target === 'bot' ? 'bot' : 'your';

  const channels = [...interaction.guild.channels.cache.filter(c =>
    c.isTextBased() && c.viewable && !c.isThread()
  ).values()];

  const skipped = channels.filter(ch => purgeChannelCache.get(ch.id) === ch.lastMessageId).length;
  const toScan = channels.length - skipped;

  let deleted = 0;
  let scanned = 0;
  let lastUpdate = Date.now();

  const statusLine = () =>
    `🔍 **${scanned}/${toScan}** channels scanned — **${deleted}** deleted${skipped ? ` *(${skipped} skipped)*` : ''}`;

  try {
    await interaction.editReply(statusLine());

    for (const ch of channels) {
      if (purgeChannelCache.get(ch.id) === ch.lastMessageId) continue;

      let lastId = null;
      for (let page = 0; page < 50; page++) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        let fetched;
        try { fetched = await ch.messages.fetch(options); } catch { break; }
        if (!fetched.size) break;

        lastId = fetched.last().id;

        const targetMsgs = fetched.filter(m => m.author.id === targetId);
        if (targetMsgs.size > 0) {
          try {
            const result = await ch.bulkDelete(targetMsgs, true);
            deleted += result.size;
          } catch {
            for (const msg of targetMsgs.values()) {
              try { await msg.delete(); deleted++; } catch {}
            }
          }
        }

        if (fetched.size < 100) break;
      }

      purgeChannelCache.set(ch.id, ch.lastMessageId);
      savePurgeCache();
      scanned++;

      // Update every 5 channels or every 8 seconds
      if (scanned % 5 === 0 || Date.now() - lastUpdate > 8000) {
        await interaction.editReply(statusLine()).catch(() => {});
        lastUpdate = Date.now();
      }
    }

    await interaction.editReply(deleted > 0
      ? `✅ Done — purged **${deleted}** ${label} messages across **${toScan}** channels.${skipped ? ` *(${skipped} skipped)*` : ''}`
      : `✅ Done — no ${label} messages found across **${toScan}** channels.${skipped ? ` *(${skipped} skipped)*` : ''}`);
  } catch (error) {
    console.error('Error purging messages:', error);
    await interaction.editReply('An error occurred while purging messages.');
  }
};


// === GEOGUESSR HELPERS ===
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function geoScore(km) {
  return Math.max(0, Math.round(5000 * Math.exp(-km / 2000)));
}

async function geocodeGuess(query) {
  if (!checkGoogleQuota()) { console.warn('[Quota] Google monthly limit reached'); return null; }
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}`;
    const res = await axios.get(url);
    if (res.data.status !== 'OK') console.error('[Geocode] status:', res.data.status, res.data.error_message || '');
    if (res.data.status === 'OK' && res.data.results.length > 0) {
      const loc = res.data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng, address: res.data.results[0].formatted_address };
    }
  } catch {}
  return null;
}

async function geocodeNominatim(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'discord-geoguessr-bot/1.0' } });
    if (res.data.length > 0) {
      const r = res.data[0];
      return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name };
    }
  } catch {}
  return null;
}

async function revealGeoGuessr(channel, game) {
  clearTimeout(game.timeout);
  geoguessrGames.delete(channel.id);
  const { lat, lng, country } = game;

  // Update location cooldown history
  geoHistory.push({ lat, lng });
  if (geoHistory.length > 25) geoHistory.shift();
  saveGeoHistory();

  // Persist scores to server leaderboard (only if 2+ players guessed)
  if (game.guesses.size > 1) {
    for (const [userId, g] of game.guesses.entries()) {
      if (!geoScores[userId]) geoScores[userId] = { total: 0, guesses: 0 };
      geoScores[userId].total += g.score;
      geoScores[userId].guesses += 1;
    }
    saveGeoScores();
  }

  const token = process.env.MAPBOX_TOKEN;
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l-star+f74e4e(${lng},${lat})/${lng},${lat},5,0/800x400?access_token=${token}`;

  let mapAttachment = null;
  try {
    const res = await axios.get(mapUrl, { responseType: 'arraybuffer' });
    mapAttachment = new AttachmentBuilder(Buffer.from(res.data), { name: 'result_map.png' });
  } catch {}

  const medals = ['🥇', '🥈', '🥉'];
  const sorted = [...game.guesses.entries()].sort((a, b) => b[1].score - a[1].score);

  const roundResults = sorted.length === 0
    ? '*No one guessed!*'
    : sorted.map(([userId, g], i) =>
        `${medals[i] || `${i+1}.`} <@${userId}> — *${g.address}* — **${Math.round(g.distance).toLocaleString()} km** — **${g.score.toLocaleString()} pts**`
      ).join('\n');

  const embed = new EmbedBuilder()
    .setTitle(`🌍 The answer was: ${country}`)
    .setDescription(roundResults)
    .setColor(0x00AA00)
    .setFooter({ text: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)} | ${game.guesses.size > 1 ? 'Use /geoguessr leaderboard to see all-time scores' : 'Scores not counted — need 2+ players'}` });

  if (mapAttachment) embed.setImage('attachment://result_map.png');

  await channel.send({ embeds: [embed], files: mapAttachment ? [mapAttachment] : [] });
}

async function handleGeoguessr(interaction) {
  const sub = interaction.options.getSubcommand();
  const channel = interaction.channel;

  if (sub === 'start') {
    if (geoguessrGames.size > 0) {
      return interaction.reply({ content: 'A game is already running in the server. Use `/geoguessr reveal` to end it first.', ephemeral: true });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (geoDaily.date !== today) geoDaily = { date: today, count: 0 };
    if (geoDaily.count >= GEO_DAILY_LIMIT) return interaction.reply({ content: `Daily game limit reached (${geoDaily.count}/${GEO_DAILY_LIMIT}). Try again tomorrow.`, ephemeral: true });
    await interaction.deferReply();

    const heading = Math.floor(Math.random() * 360);
    let lat, lng, country = 'Unknown location';
    let found = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const tryLat = (Math.random() * 135) - 60;
      const tryLng = (Math.random() * 360) - 180;
      if (!checkGoogleQuota()) return interaction.editReply('Monthly Google API limit reached (2000 requests). Try again next month.');
      try {
        const meta = await axios.get(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${tryLat},${tryLng}&radius=5000&key=${process.env.GOOGLE_API_KEY}`);
        if (meta.data.status === 'OK') {
          lat = meta.data.location?.lat ?? tryLat;
          lng = meta.data.location?.lng ?? tryLng;
          found = true;
          break;
        }
      } catch {}
    }
    if (!found) return interaction.editReply('Could not find a Street View location after several tries. Please try again.');
    try {
      const rev = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'User-Agent': 'discord-geoguessr-bot/1.0' } });
      if (rev.data?.address?.country) country = rev.data.address.country;
      else if (rev.data?.display_name) country = rev.data.display_name.split(',').slice(-2).join(',').trim();
    } catch {}
    if (!checkGoogleQuota()) return interaction.editReply('Monthly Google API limit reached (2000 requests). Try again next month.');
    const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${lat},${lng}&fov=90&heading=${heading}&pitch=0&key=${process.env.GOOGLE_API_KEY}`;
    let attachment;
    try {
      const res = await axios.get(svUrl, { responseType: 'arraybuffer' });
      attachment = new AttachmentBuilder(Buffer.from(res.data), { name: 'streetview.jpg' });
    } catch {
      return interaction.editReply('Failed to fetch street view image. Try again.');
    }

    const revealAt = Math.floor((Date.now() + 60 * 1000) / 1000);
    const embed = new EmbedBuilder()
      .setTitle('🌍 Where in the world is this?')
      .setDescription(`Use \`/geoguessr guess\` to submit your location guess!\nRevealing <t:${revealAt}:R> or when someone uses \`/geoguessr reveal\`.`)
      .setImage('attachment://streetview.jpg')
      .setColor(0x1A73E8);

    const timeout = setTimeout(() => {
      const game = geoguessrGames.get(channel.id);
      if (game) revealGeoGuessr(channel, game);
    }, 60 * 1000);

    geoDaily.count++;
    geoguessrGames.set(channel.id, { lat, lng, country, guesses: new Map(), timeout });
    await interaction.editReply({ embeds: [embed], files: [attachment] });

  } else if (sub === 'guess') {
    const game = geoguessrGames.get(channel.id);
    if (!game) {
      return interaction.reply({ content: 'No game is running here. Start one with `/geoguessr start`.', ephemeral: true });
    }
    if (game.guesses.has(interaction.user.id)) {
      return interaction.reply({ content: 'You have already guessed for this round!', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const query = interaction.options.getString('location');
    const geocoded = await geocodeNominatim(query);
    if (!geocoded) {
      return interaction.editReply("Couldn't find that location. Try being more specific.");
    }

    const distance = haversineKm(game.lat, game.lng, geocoded.lat, geocoded.lng);
    const score = geoScore(distance);
    game.guesses.set(interaction.user.id, { address: geocoded.address, distance, score });

    await interaction.editReply(
      `📍 You guessed **${geocoded.address}**\n📏 Distance from answer: **${Math.round(distance).toLocaleString()} km**\n⭐ Score: **${score.toLocaleString()} / 5,000 pts**`
    );

  } else if (sub === 'reveal') {
    if (!hasPermission(interaction, config.ownerId)) return;
    const game = geoguessrGames.get(channel.id);
    if (!game) {
      return interaction.reply({ content: 'No game is running here.', ephemeral: true });
    }
    await interaction.reply({ content: 'Revealing...', ephemeral: true });
    await revealGeoGuessr(channel, game);

  } else if (sub === 'leaderboard') {
    const entries = Object.entries(geoScores).filter(([, v]) => v.guesses > 0);
    if (entries.length === 0) {
      return interaction.reply({ content: 'No scores yet! Start a game with `/geoguessr start`.', ephemeral: true });
    }
    const W = 20, PRIOR = 2500;
    const sorted = entries
      .map(([userId, v]) => {
        const avg = v.total / v.guesses;
        const weighted = Math.round((v.guesses * avg + W * PRIOR) / (v.guesses + W));
        return { userId, avg: Math.round(avg), weighted, guesses: v.guesses };
      })
      .sort((a, b) => b.weighted - a.weighted)
      .slice(0, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const board = sorted.map((e, i) =>
      `${medals[i] || `**${i+1}.**`} <@${e.userId}> — **${e.weighted.toLocaleString()} pts** *(${e.avg.toLocaleString()} avg over ${e.guesses} game${e.guesses === 1 ? '' : 's'})*`
    ).join('\n');
    const embed = new EmbedBuilder()
      .setTitle('🌍 GeoGuessr — Accuracy Leaderboard')
      .setDescription(board)
      .setFooter({ text: 'Ranked by weighted score (rewards consistency over many games)' })
      .setColor(0xF4C430);
    await interaction.reply({ embeds: [embed] });
  }
}

const handleGeoRig = async (interaction) => {
  if (!hasPermission(interaction, config.ownerId)) return;
  if (geoguessrGames.size > 0) {
    return interaction.reply({ content: 'A game is already running. Reveal it first.', ephemeral: true });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (geoDaily.date !== today) geoDaily = { date: today, count: 0 };
  if (geoDaily.count >= GEO_DAILY_LIMIT) return interaction.reply({ content: `Daily game limit reached (${geoDaily.count}/${GEO_DAILY_LIMIT}). Try again tomorrow.`, ephemeral: true });
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('query');
  const geocoded = await geocodeGuess(query);
  if (!geocoded) return interaction.editReply('Could not geocode that location.');

  const { lat, lng } = geocoded;
  const heading = Math.floor(Math.random() * 360);

  // Check street view coverage
  if (!checkGoogleQuota(2)) return interaction.editReply('Monthly Google API limit reached (2000 requests). Try again next month.');
  try {
    const meta = await axios.get(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`);
    if (meta.data.status !== 'OK') return interaction.editReply(`No Street View coverage at "${geocoded.address}".`);
  } catch { return interaction.editReply('Failed to check Street View coverage.'); }

  const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${lat},${lng}&fov=90&heading=${heading}&pitch=0&key=${process.env.GOOGLE_API_KEY}`;
  let attachment;
  try {
    const res = await axios.get(svUrl, { responseType: 'arraybuffer' });
    attachment = new AttachmentBuilder(Buffer.from(res.data), { name: 'streetview.jpg' });
  } catch { return interaction.editReply('Failed to fetch Street View image.'); }

  const channel = interaction.channel;
  const revealAt = Math.floor((Date.now() + 60 * 1000) / 1000);
  const embed = new EmbedBuilder()
    .setTitle('🌍 Where in the world is this?')
    .setDescription(`Use \`/geoguessr guess\` to submit your location guess!
Revealing <t:${revealAt}:R> or when someone uses \`/geoguessr reveal\`.`)
    .setImage('attachment://streetview.jpg')
    .setColor(0x1A73E8);

  const timeout = setTimeout(() => {
    const game = geoguessrGames.get(channel.id);
    if (game) revealGeoGuessr(channel, game);
  }, 60 * 1000);

  geoDaily.count++;
  geoguessrGames.set(channel.id, { lat, lng, country: geocoded.address, guesses: new Map(), timeout });
  await channel.send({ embeds: [embed], files: [attachment] });
  await interaction.editReply(`Game started at **${geocoded.address}**. You know where it is.`);
};

const quickPurgeMessages = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild ?? await interaction.client.guilds.fetch(config.relayServerId);
  const channels = [...guild.channels.cache.filter(c =>
    c.isTextBased() && c.viewable && !c.isThread()
  ).values()];

  let deleted = 0;

  for (const ch of channels) {
    let fetched;
    try { fetched = await ch.messages.fetch({ limit: 100 }); } catch { continue; }
    const botMsgs = fetched.filter(m => m.author.id === client.user.id);
    if (!botMsgs.size) continue;
    try {
      const result = await ch.bulkDelete(botMsgs, true);
      deleted += result.size;
    } catch {
      for (const msg of botMsgs.values()) {
        try { await msg.delete(); deleted++; } catch {}
      }
    }
  }

  await interaction.editReply(deleted > 0
    ? `✅ Quick purge done — deleted **${deleted}** bot messages.`
    : `✅ Quick purge done — no recent bot messages found.`);
};


// ====== Volanta Flight Poller ======
async function pollVolantaFlights(client) {
  if (!config.volantaUsers?.length || !config.volantaChannelId) return;
  const channel = client.guilds.cache.first()?.channels.cache.get(config.volantaChannelId);
  if (!channel) return;

  for (const user of config.volantaUsers) {
    try {
      const res = await axios.get(
        `https://api.volanta.app/api/v1/Flights/user/${user.userId}?page=1&pageSize=1`,
        { headers: { Accept: 'application/json' }, timeout: 10000 }
      );
      const flights = res.data;
      if (!flights || !flights.length) continue;
      const flight = flights[0].flight;
      if (!flight || flight.state !== 'Completed') continue;
      if (flight.id === lastVolantaFlightIds.get(user.userId)) continue;
      lastVolantaFlightIds.set(user.userId, flight.id);
      try {
        const toSave = Object.fromEntries(lastVolantaFlightIds);
        fs.writeFileSync(VOLANTA_LAST_FLIGHT_PATH, JSON.stringify(toSave, null, 2));
      } catch(e) {}

      const origin = flight.originIcao || '???';
      const dest = flight.destinationIcao || '???';
      const originName = flight.origin?.name || origin;
      const destName = flight.destination?.name || dest;
      const aircraft = flight.aircraftIcao || 'Unknown';
      const aircraftTitle = flight.aircraftTitle || aircraft;
      const airline = flight.aircraft?.airline?.name || '';
      const callsign = flight.callsign || flight.flightNumber || 'Unknown';
      const distNm = flight.distanceFlownInNauticalMiles ? `${Math.round(flight.distanceFlownInNauticalMiles).toLocaleString()} nm` : 'Unknown';
      const flightTimeSec = flight.realFlightTime || flight.effectiveFlightTime || 0;
      const hrs = Math.floor(flightTimeSec / 3600);
      const mins = Math.floor((flightTimeSec % 3600) / 60);
      const duration = flightTimeSec ? `${hrs}h ${mins}m` : 'Unknown';
      const CELESTIAL_ID = 'c8dce899-5b6b-4534-3fb9-08dca7f6f6ee';
      let rawLandingRate = flight.landingRate ? Math.round(flight.landingRate) : null;
      if (rawLandingRate !== null && user.userId === CELESTIAL_ID) {
        const pct = 1 + (Math.random() * 1.05 + 0.35);
        rawLandingRate = Math.round(rawLandingRate * pct);
      }
      const landingRate = rawLandingRate !== null ? `${rawLandingRate} fpm` : 'Unknown';
      let celestialComment = null;
      if (user.userId === CELESTIAL_ID && rawLandingRate !== null) {
        const abs = Math.abs(rawLandingRate);
        if (abs >= 600) {
          const opts = [
            "I'm calling the NTSB.",
            "Are you sure you're qualified to do this?",
            "Runway inspection requested. And a structural survey.",
            "Gonna need an engineering inspection after that one.",
            "The black box is on fire. Literally.",
            "That wasn't a landing, that was a controlled crash.",
            "Passengers are suing. All of them.",
            "Tower: \"Are you okay?\" Celestial: \"Define okay.\"",
            "The runway would like to press charges.",
            "Sir this is a Boeing not a lawn dart.",
            "That landing was so hard it showed up on seismographs.",
            "Gear collapse probability: high. Very high.",
            "We're going to need a bigger repair bill.",
            "The ground crew are reconsidering their career choices.",
            "This flight has been flagged for a safety review.",
          ];
          celestialComment = opts[Math.floor(Math.random() * opts.length)];
        } else if (abs >= 400) {
          const opts = [
            "Did you just attack the runway?",
            "Gear collapse imminent. Maybe. Probably.",
            "I've seen smoother arrivals from cargo drops.",
            "The passengers have filed a formal complaint.",
            "That's one way to stop a plane I suppose.",
            "The overhead bins are now on the floor.",
            "Firm but survivable. Barely.",
            "The airline would like a word with you.",
            "Several passengers have asked to deplane immediately.",
            "Coffee? All over the ceiling now.",
            "The co-pilot has gone quiet.",
            "Not a greaser. Not even close.",
            "The ground crew saw that. They're not impressed.",
            "That's going in the report.",
            "You've been added to the simulator training list.",
          ];
          celestialComment = opts[Math.floor(Math.random() * opts.length)];
        } else if (abs >= 200) {
          const opts = [
            "A bit firm there mate.",
            "The overhead bins didn't stand a chance.",
            "The passengers would like a word.",
            "Solid. Very solid. Too solid.",
            "Not a bounce, more of a thud.",
            "The cabin crew are giving you a look.",
            "Felt that one in economy and business.",
            "Your passengers have left a 3 star review.",
            "Not illegal. Just uncomfortable.",
            "The wheels are filing a complaint.",
            "Bold landing strategy. Questionable, but bold.",
            "A few people spilled their drinks. Just saying.",
            "The flight attendants have seen better.",
            "You'll want to check those tyres.",
            "Not your finest work.",
          ];
          celestialComment = opts[Math.floor(Math.random() * opts.length)];
        }
      }
      const fuelBurn = flight.fuelBurn ? `${Math.round(flight.fuelBurn).toLocaleString()} kg` : null;
      const avgSpeed = (flight.distanceFlownInNauticalMiles && flightTimeSec) ? `${Math.round(flight.distanceFlownInNauticalMiles / (flightTimeSec / 3600))} kt` : null;
      const embed = new EmbedBuilder()
        .setTitle(`✈️ ${user.username} just landed!`)
        .setDescription(`**${callsign}** — ${originName} (${origin}) → ${destName} (${dest})`)
        .addFields(
          { name: '🛫 Route', value: `${origin} → ${dest}`, inline: true },
          { name: '🛩️ Aircraft', value: `${aircraft}${airline ? ' · ' + airline : ''}`, inline: true },
          { name: '⏱️ Duration', value: duration, inline: true },
          { name: '📏 Distance', value: distNm, inline: true },
          { name: '🛬 Landing Rate', value: landingRate, inline: true },
          ...(fuelBurn ? [{ name: '⛽ Fuel Burn', value: fuelBurn, inline: true }] : []),
          ...(avgSpeed ? [{ name: '💨 Avg Speed', value: avgSpeed, inline: true }] : []),
        )
        .setColor(0x5865F2)
        .setTimestamp()
        .setFooter({ text: `Volanta · ${aircraftTitle}` })
        .setURL(`https://fly.volanta.app/profile/${user.username}/flights`);
      if (celestialComment) embed.addFields({ name: '💬 Verdict', value: `*"${celestialComment}"*` });
      await channel.send({ embeds: [embed] });
    } catch (e) { console.error(`Volanta poll error (${user.username}):`, e.message); }
  }
}

// ====== Emergency Squawk Poller ======
async function pollEmergencies(client) {
  try {
    const res = await axios.get('https://opensky-network.org/api/states/all', { timeout: 15000 });
    const states = res.data?.states || [];

    const currentEmergencies = new Map();
    for (const s of states) {
      const squawk = s[14];
      if (squawk && EMERGENCY_SQUAWKS[squawk] && !s[8]) { // not on ground
        currentEmergencies.set(s[0], {
          callsign: (s[1] || '').trim() || s[0],
          squawk,
          country: s[2] || 'Unknown',
          lat: s[6],
          lon: s[5],
          altFt: s[7] ? Math.round(s[7] * 3.28084) : null,
          speedKt: s[9] ? Math.round(s[9] * 1.94384) : null,
        });
      }
    }

    const channel = client.channels.cache.get(config.emergencyChannelId);
    if (!channel) return;

    // On first poll after startup, silently populate without posting
    if (emergencyFirstPoll) {
      for (const [icao24, data] of currentEmergencies) {
        knownEmergencies.set(icao24, { ...data, lastSeen: Date.now(), firstDetectedAt: Date.now() });
        pendingEmergencies.delete(icao24);
      }
      saveKnownEmergencies();
      emergencyFirstPoll = false;
      return;
    }

    // Update lastSeen for confirmed emergencies
    for (const [icao24, data] of currentEmergencies) {
      const existing = knownEmergencies.get(icao24);
      if (existing && existing.squawk === data.squawk) {
        knownEmergencies.set(icao24, { ...existing, lastSeen: Date.now() });
      }
    }
    // Remove pending if aircraft no longer showing emergency squawk
    for (const [icao24] of pendingEmergencies) {
      if (!currentEmergencies.has(icao24)) pendingEmergencies.delete(icao24);
    }

    // Require 2 consecutive polls before alerting (filters transient false positives)
    for (const [icao24, data] of currentEmergencies) {
      const existing = knownEmergencies.get(icao24);
      const squawkChanged = existing && existing.squawk !== data.squawk;
      if (!existing || squawkChanged) {
        if (squawkChanged) {
          pendingEmergencies.set(icao24, { ...data, pendingSince: Date.now() });
          continue;
        }
        if (!pendingEmergencies.has(icao24)) {
          pendingEmergencies.set(icao24, { ...data, pendingSince: Date.now() });
          continue;
        }
        // confirmed on second poll
        pendingEmergencies.delete(icao24);
        knownEmergencies.set(icao24, { ...data, lastSeen: Date.now(), firstDetectedAt: Date.now() });
        saveKnownEmergencies();
        const info = EMERGENCY_SQUAWKS[data.squawk];
        const posStr = data.lat && data.lon
          ? `[${data.lat.toFixed(2)}°, ${data.lon.toFixed(2)}°](https://www.flightradar24.com/${data.lat.toFixed(2)},${data.lon.toFixed(2)}/8)`
          : 'Unknown';
        const embed = new EmbedBuilder()
          .setTitle(`${info.label} — ${data.callsign}`)
          .setDescription(`An aircraft has squawked **${data.squawk}**`)
          .addFields(
            { name: '✈️ Callsign', value: data.callsign, inline: true },
            { name: '🌍 Origin', value: data.country, inline: true },
            { name: '📡 Squawk', value: data.squawk, inline: true },
            { name: '🏔️ Altitude', value: data.altFt ? `${data.altFt.toLocaleString()} ft` : 'Unknown', inline: true },
            { name: '💨 Speed', value: data.speedKt ? `${data.speedKt} kt` : 'Unknown', inline: true },
            { name: '📍 Position', value: posStr, inline: true },
            { name: '🕐 First Detected', value: `<t:${Math.floor((data.firstDetectedAt || Date.now()) / 1000)}:R>`, inline: true },
          )
          .setColor(info.color)
          .setTimestamp()
          .setFooter({ text: 'Source: OpenSky Network • Updates every 60s' });

        // Attach a map if we have a position and a Mapbox token
        if (data.lat && data.lon && config.mapboxToken) {
          try {
            const marker = `pin-s-airport+ff0000(${data.lon.toFixed(4)},${data.lat.toFixed(4)})`;
            const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${marker}/${data.lon.toFixed(4)},${data.lat.toFixed(4)},5/900x400?access_token=${config.mapboxToken}`;
            const mapRes = await axios.get(mapUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const attachment = new AttachmentBuilder(Buffer.from(mapRes.data), { name: 'emergency.png' });
            embed.setImage('attachment://emergency.png');
            await channel.send({ embeds: [embed], files: [attachment] });
          } catch {
            await channel.send({ embeds: [embed] });
          }
        } else {
          await channel.send({ embeds: [embed] });
        }
      }
    }

    // Clear resolved emergencies (15 min grace period to handle API dropouts)
    const GRACE_MS = 15 * 60 * 1000;
    for (const [icao24, entry] of knownEmergencies) {
      if (!currentEmergencies.has(icao24)) {
        if (Date.now() - (entry.lastSeen || 0) > GRACE_MS) {
          knownEmergencies.delete(icao24);
          saveKnownEmergencies();
        }
      }
    }
  } catch (error) {
    console.error('Emergency poll error:', error.message);
  }
}

// ====== Login ======
client.login(token);
