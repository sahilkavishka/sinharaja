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
