## Visualize work item relationships

[![Demo](images/wvizdemo.png)](https://channel9.msdn.com/Series/Visual-Studio-ALM-Rangers-Demos/VS-Team-Services-Work-Item-Visualization-Extension) In Visual Studio Team Services you can add, edit and display work items in query results and various boards. With this extension you can visualize these work items from within the work item form. 

![Visualize](images/image1.png)

----------

## What's new?

- Share and remove visualizations
- Filter visualizations
- Expand/collapse selected nodes
- Zoom by scrolling or pinching (touch)
- Box selection with ctrl + mouse

----------

## Quick steps to get started

![Orient](images/image6.png)

- **Visualize from Work Item form or Board**
	1. Select a work item. 
		- If you are using the classic WI item form, select `Visualize` on the toolbar.
		- Otherwise click on `...` and select `Visualize`.
		- Visualization dialog will open up with the selected work item and its direct links expanded.
	1. Left click on the card on the graph to expand its links.
	1. Right click on a card on the graph to open the item in a new window.
	1. Click on `Zoom In`, `Zoom Out`, `Zoom to original size` or `Fit To icons` on the toolbar to re-size.
- **Visualize from Query or Backlog items view**
	1. Open backlog or Create / Open a Query.
	2. Select one or many work items.
	3. Right Click and open context menu, select `Visualize`.
![Visualize from Query](images/VisualizeFromQuery.png)	
- **Highlight**
	1. Click on the `Toggle Legend Pane` icon on the right. A pane will expand.
	2. Click on `add highlight`. A modal dialog will open to add.
	3. Select `Work Item Type`, `Feature`, and enter `color` (ie. red) in text color. 
	4. Click `Save` to apply the highlighting.


----------

## Key features

### Drill-down in your chart and even visualize commits

You can visually see how work items relate to each other, as well as code, tests, test results, builds and external artifacts. Even drill into your commits to explore the changeset details.

![Commit](images/image4.png)

### Highlight what's important
Use colors to highlight important work item types within your visualization.

![Highlight](images/image3.png)

### Focus on what's important
Use `Zoom In`, `Zoom Out`, `Zoom to original size` or `Fit To` toolbar icons to zoom in and out of your chart. Switch the orientation of your chart between `horizontal` and `vertical` view.

![Orient](images/image2.png)

### Export for offline viewing

> NOT supported with Internet Explorer (IE)

Export your chart visualization for offline viewing or printing. 

![Export](images/image5.png)

### Add annotations to items on visualization

Add additional annotations to the visualizations and pin them to the items on visualization. 

![Add annotation](images/annotations.png)

Remove annotations through context menu.

![Remove annotation](images/removeAnnotation.png)

### Save visualizations on project level to share

> **Updated** - *This is an early version with limited functionality. Please provide feedback.*

Save a new visualization or update existing saved visualizations on project level.  

![Share visualization](images/shareVisualization.png)

> **New** - *This is an early version with limited functionality. Please provide feedback.*

You can now also remove saved visualization.

![Remove saved visualization](images/removeSavedVisualization.png)

### Find on visualization

Previously the find on visualization allowed to enter and id and start visualization from it. Since we have visualization possible from all contexts now we deemed this unnecessary and thought it may be more useful to allow searching items on the visualization instead.  

![Find on visualization](images/findOnVisualization.png)

### Filter on visualization

> **New** - *This is an early version with limited functionality. Please provide feedback.*

We now support filtering items on visualization by All, Work Items Only, Work Items with Changes and Work Items with Changes and Files.

![Filter visualization](images/filterVisualization.png)

### Collapse / Expand

> **New** - *This is an early version with limited functionality. Please provide feedback.*
c

![Collapse Expand](images/contextMenu_collapse_expand.png)

> **New** - *You can now Zoom by scrolling or pinching (touch). You can also do box selection with ctrl + mouse.*

![Select many](images/ctrl_select_many.png)

----------

[View Notices](https://marketplace.visualstudio.com/_apis/public/gallery/publisher/ms-devlabs/extension/WorkitemVisualization/latest/assetbyname/ThirdPartyNotice.txt) for third party software included in this extension.

> Microsoft DevLabs is an outlet for experiments from Microsoft, experiments that represent some of the latest ideas around developer tools. Solutions in this category are designed for broad usage, and you are encouraged to use and provide feedback on them; however, these extensions are not supported nor are any commitments made as to their longevity.

## Prerequisites

- Team Services
- Team Foundation Server 2015 Update 3, or higher 

## Contributors

We thank the following contributor(s) for this extension: Jeff Levinson, [Taavi Koosaar](https://blogs.msdn.microsoft.com/visualstudioalmrangers/2012/03/22/introducing-the-visual-studio-alm-rangers-taavi-koosaar/) and [Mattias Sköld](https://blogs.msdn.microsoft.com/willy-peter_schaub/2011/03/28/introducing-the-visual-studio-alm-rangers-mattias-skld/).

## Feedback

We need your feedback! Here are some of the ways to connect with us:

- Add a review below
- Send us an [email](mailto://mktdevlabs@microsoft.com).

Review the [list of features and resolved issues of latest tools and extensions](https://aka.ms/vsarreleases) for more information on latest releases. 
