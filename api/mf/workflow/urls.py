from django.urls import path
from . import views

urlpatterns = [
    path('new', views.new_workflow, name='new workflow'),
    path('open', views.open_workflow, name='open workflow'),
    path('edit', views.edit_workflow, name='edit workflow'),
    path('save', views.save_workflow, name='save'),
    path('execute', views.execute_workflow, name='execute workflow'),
    path('execute/<str:node_id>/successors', views.get_successors, name='get node successors'),
    path('globals', views.global_vars, name="retrieve global variables"),
    path('upload', views.upload_file, name='upload file'),
    path('download', views.download_file, name='download file'),
    path('nodes', views.retrieve_nodes_for_user, name='retrieve node list'),
    path('savetoserver', views.save_workflow_to_server, name='save to server'),
]
