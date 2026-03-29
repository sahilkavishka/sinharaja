from django.db import models

class Scene(models.Model):
    # 1. දර්ශනයේ නම (අපිට අඳුරගන්න ලේසි වෙන්න)
    title = models.CharField(max_length=100) 
    
    # 2. Player ට පේන විස්තරය (උදා: ඔයා ගඟක් ගාව ඉන්නේ...)
    description = models.TextField() 
    
    # 3. පින්තූරය (දැනට අපි ලින්ක් එකක් විදියට තියාගමු)
    image_url = models.CharField(max_length=500, blank=True)

    # 4. පළවෙනි තීරණය (Option 1)
    choice_1_text = models.CharField(max_length=100, blank=True)
    # මේක තේරුවොත් ඊළඟට යන්න ඕන Scene එකේ ID අංකය
    choice_1_next_id = models.IntegerField(default=0)

    # 5. දෙවෙනි තීරණය (Option 2)
    choice_2_text = models.CharField(max_length=100, blank=True)
    choice_2_next_id = models.IntegerField(default=0)

    def __str__(self):
        return self.title

    # පළවෙනි තීරණයේ ප්‍රතිඵල
    choice_1_health_effect = models.IntegerField(default=0) # Health එකට වෙන දේ (උදා: -10)
    choice_1_sanity_effect = models.IntegerField(default=0) # Sanity එකට වෙන දේ

    # දෙවෙනි තීරණයේ ප්‍රතිඵල
    choice_2_health_effect = models.IntegerField(default=0)
    choice_2_sanity_effect = models.IntegerField(default=0)

    def __str__(self):
        return self.title

# මේ Scene එකට ආවම Player ට හම්බවෙන දේ (උදා: "පරණ යතුර")
    given_item = models.CharField(max_length=50, blank=True, null=True) 

    # පළවෙනි තීරණය ගන්න නම් (උදා: දොර අරින්න) අතේ තියෙන්න ඕන දේ
    required_item_for_choice_1 = models.CharField(max_length=50, blank=True, null=True)
    
    # දෙවෙනි තීරණය ගන්න නම් අතේ තියෙන්න ඕන දේ
    required_item_for_choice_2 = models.CharField(max_length=50, blank=True, null=True)

    # --- අලුත්: Quick Time Events (Timer) ---
    
    # මේක හදිසි අවස්ථාවක්ද? (ඔව්/නෑ)
    is_timed = models.BooleanField(default=False)
    
    # තත්පර කීයක් දෙනවද? (උදා: 5)
    time_limit = models.IntegerField(default=5)
    
    # වෙලාව ඉවර වුනොත් මොකද වෙන්නේ? (දඬුවම)
    timeout_next_id = models.IntegerField(default=0) # යන්න ඕන ඊළඟ Scene එක
    timeout_health_effect = models.IntegerField(default=0) # ලේ අඩු වෙන ගාණ (උදා: -20)