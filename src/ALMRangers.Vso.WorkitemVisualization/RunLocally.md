#Using plugin IIS Express Executor

OR in VS Code install plugin called "IIS Express Executor"
and set standard settings such as using F1:
IIS-EE select browser
IIS-EE set port (44301)
IIS-EE set server protocol (https)
IIS-EE set server running folder (to the path thats root of the app)

and then just
"F1" and type "iis start" and enter

#Manual approach

Use the vss-extension.local.json to create a extension that is hosted on localhost and publish it privately and share with account on VSTS.

In %userprofile%\Documents\IISExpress\config\applicationhost.config make sure to have a local site. Change physicalPath to correct.

            <site name="ALMRangers.Vso.WorkitemVisualization" id="2">
                <application path="/">
                    <virtualDirectory path="/" physicalPath="c:\repos\vsts\rangers\vsarVSTS-Work-Item-Visualization\src\ALMRangers.Vso.WorkitemVisualization" />
                </application>
                <bindings>
                    <binding protocol="http" bindingInformation="*:8888:localhost" />
                    <binding protocol="https" bindingInformation="*:44301:localhost" />
                </bindings>
            </site>

Run the command: 
    "C:\Program Files (x86)\IIS Express\iisexpress.exe" /site:ALMRangers.Vso.WorkitemVisualization
