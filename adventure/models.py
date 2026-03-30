from django.db import models

class Scene(models.Model):
    # --- 1. මූලික විස්තර (Basic Info) ---
    title = models.CharField(max_length=100) 
    description = models.TextField() 
    image_url = models.CharField(max_length=500, blank=True)
    
    # අලුත් Pro කෑල්ල: මේ Scene එකට ආවම ඇහෙන්න ඕන සද්දෙ (උදා: river.mp3)
    ambient_sound = models.CharField(max_length=100, blank=True, null=True)

    # --- 2. තීරණ සහ ප්‍රතිඵල (Choices & Effects) ---
    
    # පළවෙනි තීරණය (Option 1)
    choice_1_text = models.CharField(max_length=100, blank=True)
    choice_1_next_id = models.IntegerField(default=0)
    choice_1_health_effect = models.IntegerField(default=0) 
    choice_1_sanity_effect = models.IntegerField(default=0) 

    # දෙවෙනි තීරණය (Option 2)
    choice_2_text = models.CharField(max_length=100, blank=True)
    choice_2_next_id = models.IntegerField(default=0)
    choice_2_health_effect = models.IntegerField(default=0)
    choice_2_sanity_effect = models.IntegerField(default=0)

    # --- 3. බඩු මල්ල (Inventory System) ---
    
    given_item = models.CharField(max_length=50, blank=True, null=True) 
    required_item_for_choice_1 = models.CharField(max_length=50, blank=True, null=True)
    required_item_for_choice_2 = models.CharField(max_length=50, blank=True, null=True)

    # --- 4. හදිසි අවස්ථා (Quick Time Events - Timer) ---
    
    is_timed = models.BooleanField(default=False)
    time_limit = models.IntegerField(default=5)
    timeout_next_id = models.IntegerField(default=0) 
    timeout_health_effect = models.IntegerField(default=0) 
    
    # අලුත් Pro කෑල්ල: වෙලාව ඉවර වුනොත් සිහිකල්පනාවත් අඩු වෙන්න පුළුවන්
    timeout_sanity_effect = models.IntegerField(default=0)

    def __str__(self):
        return self.title