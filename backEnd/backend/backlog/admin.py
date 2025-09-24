from django.contrib import admin
from .models import Backlog, Epic, SubEpic, UserStory, Task

admin.site.register(Backlog)
admin.site.register(Epic)
admin.site.register(SubEpic)
admin.site.register(UserStory)
admin.site.register(Task)