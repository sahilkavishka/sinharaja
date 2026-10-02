import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from adventure.models import Scene

# Clear old scenes
Scene.objects.all().delete()

scenes = [
    # Scene 1
    {
        "id": 1,
        "title": "කුඩව පිවිසුම (The Kudawa Gateway)",
        "description": "හිරු බැස යන හෝරාව. සිංහරාජයේ ඝන මීදුම අතරින් අඳුරු මාවත් දෙකක් දිස්වේ. ඔබ පැමිණියේ මීට වසර 30කට පෙර අතුරුදහන් වූ පරිසර පර්යේෂක කණ්ඩායමේ අභිරහස සෙවීමටයි.",
        "image_url": "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1920",
        "ambient_sound": "rainforest_night.mp3",
        "given_item": "පරණ සිතියම",
        "hotspots": [
            {"x": 75, "y": 70, "title": "බිම වැටුණු මල්ල", "item": "ලුණු පැකට්ටුව", "message": "ඔබට ලුණු පැකට්ටුවක් හමුවිය! කූඩැල්ලන්ගෙන් බේරීමට මෙය අත්‍යවශ්‍ය වේ."}
        ],
        "choice_1_text": "ගංගා නිම්නය ඔස්සේ ඉදිරියට යන්න",
        "choice_1_next_id": 2,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 0,
        "choice_2_text": "අතහැර දැමූ පැරණි වන මුරපොළ පරීක්ෂා කරන්න",
        "choice_2_next_id": 3,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": 0,
        "lore_title": "සිංහරාජ වැසි වනාන්තරය",
        "lore_description": "යුනෙස්කෝ ලෝක උරුමයක් වන ශ්‍රී ලංකාවේ ඉතිරිව ඇති එකම ප්‍රාථමික නිවර්තන වැසි වනාන්තරයයි."
    },
    # Scene 2
    {
        "id": 2,
        "title": "අඳුරු ගංගා නිම්නය (The Leech Basin)",
        "description": "ගංගාවේ දිය රළ සද්දය සමඟ සීතල සුළඟක් හමා එයි. පය තබන තැන කූඩැල්ලන් දහස් ගණනක් ඔබ දෙසට ඇදී එයි! ඉක්මන් තීරණයක් ගන්න.",
        "image_url": "https://images.unsplash.com/photo-1440342359726-5918314352d8?q=80&w=1920",
        "ambient_sound": "river_stream.mp3",
        "choice_1_text": "ලුණු දමා කූඩැල්ලන් ඉවත් කරමින් ඉදිරියට යන්න",
        "choice_1_next_id": 4,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 10,
        "required_item_for_choice_1": "ලුණු පැකට්ටුව",
        "choice_2_text": "කූඩැල්ලන් නොතකා වේගයෙන් දුවන්න",
        "choice_2_next_id": 4,
        "choice_2_health_effect": -20,
        "choice_2_sanity_effect": -15,
        "choice_3_text": "ගං ඉවුරේ ඇති පැරණි ඔරුව පරීක්ෂා කරන්න",
        "choice_3_next_id": 5,
        "choice_3_health_effect": 0,
        "choice_3_sanity_effect": 0,
        "lore_title": "ලංකා කූඩැල්ලා (Land Leech)",
        "lore_description": "තෙතමනය අධික පරිසරවල ලේ උරා බොන ඇනලිඩා විශේෂයකි. ලුණු හෝ දෙහි යුෂ මඟින් පහසුවෙන් ඉවත් කළ හැක."
    },
    # Scene 3
    {
        "id": 3,
        "title": "අතහැර දැමූ වන මුරපොළ (Ruined Ranger Outpost)",
        "description": "දිරාගිය ලී බිත්ති සහ කැඩුණු ජනෙල්. මෙහි වසර ගණනාවකින් කිසිවෙකු පය තබා නැති සෙයකි. බිම අද්භූත සීරීම් ලකුණු දක්නට ලැබේ.",
        "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920",
        "ambient_sound": "creaking_cabin.mp3",
        "hotspots": [
            {"x": 40, "y": 60, "title": "දිරාගිය මේසය", "item": "විදුලි පන්දම", "message": "ඔබට හොඳින් වැඩකරන විදුලි පන්දමක් (Torch) හමුවිය!"},
            {"x": 25, "y": 75, "title": "කැඩුණු පෙට්ටිය", "item": "බැටරි", "message": "ඔබට අමතර බැටරි කට්ටලයක් හමුවිය!"}
        ],
        "choice_1_text": "මේසය මත ඇති දිනපොත කියවා බැලීම",
        "choice_1_next_id": 6,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": -10,
        "choice_2_text": "පිටුපස ඇති කඳුකර මාර්ගයට පිවිසෙන්න",
        "choice_2_next_id": 4,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": 0,
    },
    # Scene 4
    {
        "id": 4,
        "title": "මීදුම පිරි පර්වත මාවත (The Misty Cliff)",
        "description": "ක්ෂණිකව මීදුම ඝන විය! කඳු මුදුනෙන් විශාල ගල් පර්වතයක් පෙරළී එයි! වහාම බේරීමට තීරණයක් ගන්න!",
        "image_url": "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920",
        "ambient_sound": "thunder_wind.mp3",
        "is_timed": True,
        "time_limit": 7,
        "timeout_next_id": 7,
        "timeout_health_effect": -35,
        "timeout_sanity_effect": -20,
        "screen_shake": True,
        "choice_1_text": "දකුණු පස ඇති ගල් කුහරයට පනින්න",
        "choice_1_next_id": 7,
        "choice_1_health_effect": -5,
        "choice_1_sanity_effect": 5,
        "choice_2_text": "බිම වැතිරී බෑගයෙන් හිස ආවරණය කරගන්න",
        "choice_2_next_id": 7,
        "choice_2_health_effect": -20,
        "choice_2_sanity_effect": -10,
    },
    # Scene 5
    {
        "id": 5,
        "title": "අභිරහස් ඔරු තොට (Mystic River Crossing)",
        "description": "පැරණි ඔරුවේ මළකඩ කෑ යකඩ පෙට්ටියක් ඇත. ඒ මත පුරාණ සිංහල අක්ෂරවලින් ලියූ ප්‍රහේලිකාවක් කොටා ඇත.",
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920",
        "ambient_sound": "river_stream.mp3",
        "is_puzzle": True,
        "puzzle_question": "ප්‍රහේලිකාව: සිංහරාජයේ රජු ලෙස සලකන, කඳුකරයේ වෙසෙන ප්‍රධාන විලෝපිකයා කවුද? (ඉඟිය: දිවියා / කොටියා)",
        "puzzle_answer": "දිවියා",
        "puzzle_success_next_id": 8,
        "puzzle_error_message": "කේතය වැරදියි! නැවත උත්සාහ කරන්න.",
        "given_item": "පුරාණ පිත්තල යතුර",
        "choice_1_text": "ප්‍රහේලිකාව අතහැර කඳුකර මාවතට යන්න",
        "choice_1_next_id": 4,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 0,
    },
    # Scene 6
    {
        "id": 6,
        "title": "දිනපොතේ රහස (The Ranger's Log)",
        "description": "'1987 නොවැම්බර් 14: ඔවුන් කැලේ ගැඹුරට ගියා. නමුත් ආපසු ආවේ සෙවනැලි පමණයි. භූගත ගල් ලෙන තුළ ඇති දොරටුව කිසිවිටෙක අරින්න එපා!' දිනපොතේ අවසන් පිටුව ලෙයින් පෙඟී ඇත.",
        "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1920",
        "ambient_sound": "creaking_cabin.mp3",
        "given_item": "රහස් දිනපොත",
        "choice_1_text": "ගල් ලෙන සෙවීමට මීදුම් පර්වතයට යන්න",
        "choice_1_next_id": 4,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": -5,
        "choice_2_text": "අද්භූත ශබ්දය ඇසුණු මිටියාවතට යන්න",
        "choice_2_next_id": 7,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": 0,
    },
    # Scene 7
    {
        "id": 7,
        "title": "විෂඝෝර පළා පොළඟා (The Green Pit Viper)",
        "description": "ගස් අත්තක එල්ලී සිටින තද කොළ පැහැති පළා පොළඟෙක් ඔබේ මුහුණ අසලට හිස ඔසවා තර්ජනය කරයි! තප්පරයක් හෝ ප්‍රමාද වුවහොත් දෂ්ට කරනු ඇත!",
        "image_url": "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=1920",
        "ambient_sound": "snake_hiss.mp3",
        "lore_title": "පළා පොළඟා (Green Pit Viper)",
        "lore_description": "ශ්‍රී ලංකාවට ආවේණික තුරුලතා ආශ්‍රිත වෙසෙන මධ්‍යස්ථ විෂ සහිත අලංකාර සර්පයෙකි.",
        "choice_1_text": "විදුලි පන්දම දල්වා සර්පයා බියගන්වන්න",
        "choice_1_next_id": 9,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 10,
        "required_item_for_choice_1": "විදුලි පන්දම",
        "choice_2_text": "නිශ්චලව හිඳ සෙමින් පසුපසට අඩිය තබන්න",
        "choice_2_next_id": 9,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": -15,
        "choice_3_text": "අතින් ගසා සර්පයාව ඉවත් කරන්න",
        "choice_3_next_id": 9,
        "choice_3_health_effect": -40,
        "choice_3_sanity_effect": -25,
    },
    # Scene 8
    {
        "id": 8,
        "title": "භූගත ලෙන් දොරටුව (The Sealed Cavern Entrance)",
        "description": "යෝධ ලතා මණ්ඩපයකින් වැසුණු අද්භූත ගල් ගුහාවක්. දොරටුවේ පැරණි සිංහ මුහුණක් සහ යතුරු හිලක් සහිත ගල් දොරක් ඇත.",
        "image_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1920",
        "ambient_sound": "wind_cave.mp3",
        "choice_1_text": "පුරාණ පිත්තල යතුර දමා දොර අරින්න",
        "choice_1_next_id": 10,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 15,
        "required_item_for_choice_1": "පුරාණ පිත්තල යතුර",
        "choice_2_text": "දොර විවෘත කිරීමට බර ගලකින් පහර දෙන්න",
        "choice_2_next_id": 10,
        "choice_2_health_effect": -15,
        "choice_2_sanity_effect": -20,
        "choice_3_text": "ආපසු හැරී පිටත වන මාවත දිගේ යන්න",
        "choice_3_next_id": 9,
        "choice_3_health_effect": 0,
        "choice_3_sanity_effect": 0,
    },
    # Scene 9
    {
        "id": 9,
        "title": "මධ්‍යම රාත්‍රියේ කඳවුර (Midnight Sanctuary)",
        "description": "ඔබ වැසි වනාන්තරයේ හදවතට පැමිණ ඇත. රාත්‍රී අන්ධකාරය රජ කරයි. අහසේ විදුලි කොටයි. ගිනිමැලයක් දල්වා ගත යුතුය.",
        "image_url": "https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1920",
        "ambient_sound": "rainforest_night.mp3",
        "hotspots": [
            {"x": 50, "y": 80, "title": "වියළි දර සහ ගිනිගල්", "item": "ගිනි උපකරණය", "message": "ඔබට ගිනි දැල්වීමට අවශ්‍ය උපකරණ හමුවිය!"}
        ],
        "choice_1_text": "ගිනිමැලයක් දල්වා විවේක ගන්න (Health & Sanity වැඩිවේ)",
        "choice_1_next_id": 11,
        "choice_1_health_effect": 30,
        "choice_1_sanity_effect": 25,
        "required_item_for_choice_1": "ගිනි උපකරණය",
        "choice_2_text": "අඳුරේම ඉදිරියට ගමන් කරන්න",
        "choice_2_next_id": 10,
        "choice_2_health_effect": -10,
        "choice_2_sanity_effect": -25,
    },
    # Scene 10
    {
        "id": 10,
        "title": "ප්‍රතිදීප්ත හතු සහ අද්භූත ලෙන (Bioluminescent Cavern)",
        "description": "අන්ධකාරය මැදින් නිල් සහ කොළ පැහැයෙන් දිදුලන දිලීර වලින් ලෙනම ආලෝකමත් වී ඇත! මෙහි පැරණි විද්‍යාගාර උපකරණ සහ ඇටසැකිල්ලක් දක්නට ලැබේ.",
        "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920",
        "ambient_sound": "glowing_cave.mp3",
        "lore_title": "දිදුලන හතු (Bioluminescent Fungi)",
        "lore_description": "සිංහරාජයේ අඳුරු හා තෙතමනය අධික ස්ථානවල ස්වභාවික ආලෝකය විහිදුවන දිලීර වර්ගයකි.",
        "hotspots": [
            {"x": 65, "y": 60, "title": "ඇටසැකිල්ල අසල පෙට්ටිය", "item": "පර්යේෂණ සාම්පල", "message": "වසර 30ක් පැරණි අතුරුදහන් වූ පර්යේෂණ සාම්පල බඳුන ඔබට හමුවිය!"}
        ],
        "choice_1_text": "පර්යේෂණ ලේඛන පරීක්ෂා කර ඉදිරි මඟ සොයාගන්න",
        "choice_1_next_id": 12,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 10,
        "choice_2_text": "ලෙන කෙළවර ඇති භූගත දියඇල්ල දෙසට යන්න",
        "choice_2_next_id": 11,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": 0,
    },
    # Scene 11
    {
        "id": 11,
        "title": "සිංහරාජයේ රහස් දියඇල්ල (The Hidden Waterfall)",
        "description": "ජල පහරේ වේගය අධිකයි! ඉහළින් විශාල ජල කඳක් ඔබ වෙත ගලා එයි! තත්පර කිහිපයකින් ගසාගෙන යා හැක!",
        "image_url": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1920",
        "ambient_sound": "waterfall_roar.mp3",
        "is_timed": True,
        "time_limit": 8,
        "timeout_next_id": 12,
        "timeout_health_effect": -30,
        "timeout_sanity_effect": -20,
        "screen_shake": True,
        "choice_1_text": "ලතා වැලක එල්ලී ඉහළට නගින්න",
        "choice_1_next_id": 12,
        "choice_1_health_effect": -5,
        "choice_1_sanity_effect": 10,
        "choice_2_text": "දියඇල්ල පිටුපස ඇති රහස් කුටියට පනින්න",
        "choice_2_next_id": 13,
        "choice_2_health_effect": -10,
        "choice_2_sanity_effect": 15,
    },
    # Scene 12
    {
        "id": 12,
        "title": "පූජනීය නාවෘක්ෂය අබියස (The Sacred Nawada Colossus)",
        "description": "අහස උසට විහිදුණු යෝධ නාවෘක්ෂය. උදෑසන හිරු කිරණ මීදුම අතරින් පතිත වේ. ඈතින් ගලවා ගැනීමේ හෙලිකොප්ටරයක ශබ්දය ඇසේ!",
        "image_url": "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1920",
        "ambient_sound": "morning_birds.mp3",
        "choice_1_text": "පර්යේෂණ සාම්පල පෙන්වා සංඥා කරන්න (Hero Ending)",
        "choice_1_next_id": 14,
        "choice_1_health_effect": 0,
        "choice_1_sanity_effect": 20,
        "required_item_for_choice_1": "පර්යේෂණ සාම්පල",
        "choice_2_text": "දිවි ගලවා ගැනීමට හඬ නගා සංඥා කරන්න",
        "choice_2_next_id": 15,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": 10,
        "choice_3_text": "කැලයේ රහස් රැකගැනීමට මෙහිම රැඳෙන්න (Guardian Ending)",
        "choice_3_next_id": 16,
        "choice_3_health_effect": 0,
        "choice_3_sanity_effect": 20,
    },
    # Scene 13
    {
        "id": 13,
        "title": "පුරාණ සිංහ කුටිය (The Ancient Relic Sanctum)",
        "description": "ශතවර්ෂ ගණනාවක් පැරණි රහස් කුටියක්. ඒ මැද පූජනීය නිල් මැණිකක් නිල් ආලෝකයෙන් දිදුලමින් තැන්පත් කර ඇත!",
        "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920",
        "ambient_sound": "mystic_drone.mp3",
        "given_item": "සිංහරාජ නිල් මැණික",
        "choice_1_text": "මැණික රැගෙන උදෑසන එළිය දෙසට පිවිසෙන්න",
        "choice_1_next_id": 14,
        "choice_1_health_effect": 10,
        "choice_1_sanity_effect": 30,
        "choice_2_text": "මැණික තිබූ තැනම තබා වන රක්ෂිතයෙන් පිටවන්න",
        "choice_2_next_id": 15,
        "choice_2_health_effect": 0,
        "choice_2_sanity_effect": 20,
    },
    # Scene 14 (Victory Ending 1)
    {
        "id": 14,
        "title": "සත්‍යයේ ජයග්‍රහණය (The True Legend)",
        "description": "හිරු පායා ඇත! ඔබ වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ රහස සහ සිංහරාජයේ පූජනීය සාම්පල සමඟ ලෝකයට පැමිණියා. ඔබේ නම ඉතිහාසයේ රන් අකුරින් ලියැවෙනු ඇත!",
        "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1920",
        "ambient_sound": "victory.mp3",
        "choice_1_next_id": 0, # Game Won
    },
    # Scene 15 (Victory Ending 2)
    {
        "id": 15,
        "title": "දිවි ගලවා ගැනීම (The Lone Survivor)",
        "description": "අතිශය දුෂ්කර අභියෝග මැද ඔබ සිංහරාජයෙන් දිවි ගලවා ගත්තා. නමුත් කැලයේ සැඟවුණු ඇතැම් රහස් තවමත් අභිරහසක් ලෙස පවතී...",
        "image_url": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1920",
        "ambient_sound": "victory.mp3",
        "choice_1_next_id": 0, # Game Won
    },
    # Scene 16 (Victory Ending 3)
    {
        "id": 16,
        "title": "වනාන්තරයේ සදාකාලික මුරකරු (The Forest Guardian)",
        "description": "ඔබ නැවත ශිෂ්ටාචාරයට නොයාමට තීරණය කළා. සිංහරාජයේ අද්භූත සුන්දරත්වය සහ රහස් සදාකාලිකව ආරක්ෂා කරන වන මුරකරු ඔබයි!",
        "image_url": "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1920",
        "ambient_sound": "victory.mp3",
        "choice_1_next_id": 0, # Game Won
    }
]

for s in scenes:
    Scene.objects.create(**s)

print(f"Successfully seeded {len(scenes)} scenes into database!")
