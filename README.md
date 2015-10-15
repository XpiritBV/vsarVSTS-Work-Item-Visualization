# Work Item Visualization Extension for Visual Studio Online

## The Gist
This VSO extension is intended to offer users the ability to visualize the relationsship between work items and any other linked items.
## Features
- Visualize in tree form the work item staring from root until no more items can be expanded
- Export the visualization to image
- Highlight items on the visualization graph based on conditions such as Work Item Type = Task, State = To Do etc
- Zoom in, Zoom out, Zoom to Fit, Box select
- Start visualization from backlog though work item context menu or find work item from the visualization hub
- Use a minimap to help navigate a large graph

## Roadmap
- Undefined until v1

## Extensibility API Features Used
- MessageArea Control
- Grid Control
- Work Item Tracking HttpClient
- Git HttpClient
- TFVC HttpClient
- Core HttpClient
- Child Dialogs (IHostDialogProvider)
- Toolbars and menus
