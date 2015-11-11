
The **Work Item Visualization** extension allows you to visualize relationships between work items from within the work item form. See how they relate to each other, as well as code, tests, test results, builds and external artifacts.

**How to use**

- Basic
	1. Connect to your team project.
	2. Select **WORK**.
	3. Navigate to a backlog.
	4. If you are using the classic WI item form, select **Visualize** on the toolbar. Otherwise click on **...** and select **Visualize**.
		- Visualization dialog will open up with the selected work item and its direct links expanded.
	6. **Left Click** on the card on the graph, it will expand its links.
	8. **Right click** on a card on the graph, it will open the item in new window.
- Zoom
	1. Click on **Zoom In**, **Zoom Out**, **Zoom to original** size or **Fit To** icons on the toolbar above the visualization.
- Highlight
	1. Click on the (**highlight**) icon on the right. A pane will expand.
	2. Click to add **highlight**. A modal dialog will open to add.
	3. Select Work Item Type, Feature, and enter color (ie. red) in text color. 
	4. **Save** and you will notice highlights of text on the graph.
- Toggle
	1. Toggle the tree to be **Top to Bottom** or **Left to Right** o toolbar.
- Export
	1. Export the visualization in Chrome, Firefox, or Edge. See known issues below for IE.

**Known Issues**

- Export does not work in IE due to IE SVG Security Error (CORS issue).
- No way to collapse nodes yet.
- Inter team project commits / changesets and files will not navigate correctly, because current project is taken from context.

**Learn more about this extension**

To learn more about developing an extension for Visual Studio Online, see the [overview of extensions](https://www.visualstudio.com/en-us/integrate/extensions/overview).

[Third Party Notice](https://marketplace.visualstudio.com/items/alm-rangers.almrangers-vsoextensions-WorkitemVisualization/ThirdPartyNotice.txt).
