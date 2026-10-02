from django.db import models

class Scene(models.Model):
    # --- 1. මූලික විස්තර (Basic Info) ---
    title = models.CharField(max_length=150) 
    description = models.TextField() 
    image_url = models.CharField(max_length=500, blank=True)
    ambient_sound = models.CharField(max_length=100, blank=True, null=True)

    # --- 2. තීරණ (Up to 4 Choices) ---
    choice_1_text = models.CharField(max_length=150, blank=True)
    choice_1_next_id = models.IntegerField(default=0)
    choice_1_health_effect = models.IntegerField(default=0) 
    choice_1_sanity_effect = models.IntegerField(default=0) 
    required_item_for_choice_1 = models.CharField(max_length=50, blank=True, null=True)

    choice_2_text = models.CharField(max_length=150, blank=True)
    choice_2_next_id = models.IntegerField(default=0)
    choice_2_health_effect = models.IntegerField(default=0)
    choice_2_sanity_effect = models.IntegerField(default=0)
    required_item_for_choice_2 = models.CharField(max_length=50, blank=True, null=True)

    choice_3_text = models.CharField(max_length=150, blank=True, null=True)
    choice_3_next_id = models.IntegerField(default=0)
    choice_3_health_effect = models.IntegerField(default=0)
    choice_3_sanity_effect = models.IntegerField(default=0)
    required_item_for_choice_3 = models.CharField(max_length=50, blank=True, null=True)

    choice_4_text = models.CharField(max_length=150, blank=True, null=True)
    choice_4_next_id = models.IntegerField(default=0)
    choice_4_health_effect = models.IntegerField(default=0)
    choice_4_sanity_effect = models.IntegerField(default=0)
    required_item_for_choice_4 = models.CharField(max_length=50, blank=True, null=True)

    # --- 3. බඩු මල්ල සහ Hotspots (Inventory & Inspection) ---
    given_item = models.CharField(max_length=50, blank=True, null=True) 
    hotspots = models.JSONField(default=list, blank=True) # e.g. [{"x": 30, "y": 45, "title": "ගස් බෙනය", "item": "පරණ බැටරිය"}]

    # --- 4. ප්‍රහේලිකා පද්ධතිය (Puzzle System) ---
    is_puzzle = models.BooleanField(default=False)
    puzzle_question = models.CharField(max_length=250, blank=True, null=True)
    puzzle_answer = models.CharField(max_length=100, blank=True, null=True)
    puzzle_success_next_id = models.IntegerField(default=0)
    puzzle_error_message = models.CharField(max_length=200, blank=True, null=True)

    # --- 5. හදිසි අවස්ථා (Quick Time Events - Timer) ---
    is_timed = models.BooleanField(default=False)
    time_limit = models.IntegerField(default=5)
    timeout_next_id = models.IntegerField(default=0) 
    timeout_health_effect = models.IntegerField(default=0) 
    timeout_sanity_effect = models.IntegerField(default=0)

    # --- 6. සජීවීකරණය සහ රූප (Visual Novel Style) ---
    background_video_url = models.CharField(max_length=500, blank=True, null=True)
    character_image_url = models.CharField(max_length=500, blank=True, null=True)
    character_position = models.CharField(max_length=10, default='center')
    character_animation = models.CharField(max_length=20, default='fade')
    screen_shake = models.BooleanField(default=False)

    # --- 7. වනජීවී සටහන් (Field Guide & Lore) ---
    lore_title = models.CharField(max_length=100, blank=True, null=True)
    lore_description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.id} - {self.title}"