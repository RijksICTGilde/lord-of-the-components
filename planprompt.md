Ok.. keep this props and values in mind. For the rest. Listen carefully and lets create a whole new plan.. based on these wishes..                                                                       
I want to use components, on an abstract level, meaning I don't really have to know what it looks like, they are a semantic representation of what we want.. I would want to use a consistent setup      
accross different templating systems.. so we can use it, in if possible in the same way, in jinja, djanog, react, java templating or web components..                                                    
The user experience has to be sublime. It has to be extremely obvious in usage. Also, naming of properties and values must be bound to an 'allow list', defined by ENUMS..                               
We have properties and values on the semantic level.. but also may have specific implementaiton properties.. so.. properties and values must be extendable..                                             
Component have basic properties, which can be property specif, same for values.. we also want to introduce event listeners, using the @ symbol, react style I believe.. which can define @click or       
@keydown events.. such events should be grouped and may be used on any component, or we define if a component supports it.. as an event on a component may actually be bound on a different element in   
the implementation.. also I want to use property "binding".. so, we can use variables or data structures.. lets say :items .. which, when used in a component, must be clearly defined again.. is it a   
list with a dict? what name/value pairs are allowed.. again.. this all must be very tighly bound.. using an enum like reference..                                                                        
So.. the user that is using our templating system will create something like this:                                                                                                                       
<c-page theme="rvo">                                                                                                                                                                                     
<c-header title="This is a title"/>                                                                                                                                                                      
<c-menu type="horizontal" :items="[{name: 'name', active: false, href='#', subitems='[{name: 'name'}]}]>                                                                                                 
so.. we also need to define the "event" properties, and the "binding" properties (though I am not sure if that is a good name)..                                                                         
also.. such binding properties are optional.. we also are allowed to just define elements.. like:                                                                                                        
<c-menu type="horizontal">                                                                                                                                                                               
<c-menu-item name="Name" url="url"/>                                                                                                                                                                     
<c-menu-item name="This has sub items">                                                                                                                                                                  
<c-menu-item name="This is a sub item because it is in another menu item"/>                                                                                                                              
</c-menu-item>                                                                                                                                                                                           
we can consider if containers are usefull, like <c-menu-items> to contain <c-menu-item>. but I think often this is not needed, so.. if possible, don;t use it..                                          
such child elements may only appear in a parent element.. they are not 'standalone'..                                                                                                                    
So..                                                                                                                                                                                                     
The basic and first layer of our system.. should be the definition of such elements.. we should start with some core elements.. like a menu, a header, a card.. a button..                               
but, most of all, make a very clear document on how we define components..                                                                                                                               
we may share properties and values enums, but a component is always defined in its own file.. and it must be completely independant.. if a component has child items, they must be defined within the    
parent component definiton...                                                                                                                                                                            
this means we end up with files that can 'deliver' a more specific implementation.. as the actual syntax MAY differ.. though.. hopefully not, between languages... I am not sure if in Java we can use   
the <c-component :binding="variable" @event="with click">                                                                                                                                                
but maybe we can.. and if not, the difference ought to be minimal.. I assume..                                                                                                                           
so.. component definition, with properties of certain types, with properties with values.. with events.. with bindings.. with possible child elemts..                                                    
then.. we need to be able to use it..                                                                                                                                                                    
Lets focus on Jinja first, as we have worked with this before...                                                                                                                                         
In Jinja, I want to use the button combined with Jinja syntax.. so things like <c-button name="{% trans %}babel translation{% endtrans%}" :items="{{ jinja_var}}"/> I am not sure if the latter is the   
right way to assign a variable in jinja though.. but you get the idea..                                                                                                                                  
so.. for jinja, we need a parser.. we already have written one before.. so.. use that! and create an implementation for it as well.. so we can test and use it while we iterate over our plan..          
the parser should be able to read our definitions.. and now comes the tricky part..                                                                                                                      
the abstract component has to become a real html output.. with classes and javascript maybe.. or a react component..                                                                                     
This is where we invented the rig script.. though.. we could consider, maybe should.. switching to typescript for this (so for both the definitions as the conversions)..                                
because.. rig script should take the 'component definition' and output the component implementation.. maybe.. we should use Python, real Python for it.. but only support a minimal set.. the idea is    
not to write a python program.. but to create the logic that actually implements a button into a theme.. and implementation..                                                                            
so.. lets say we have defined the <c-button type="primary" name="This is my name" @click="submit()"/>                                                                                                    
the rig script for RVO needs to translate this to an actual implementation.. but then language agnostic.. and I'm not sure if we can do that.. see.. we have the jinja RVO for it.. look at              
/Users/robbertuittenbroek/IdeaProjects/jinja-roos-components/src/jinja_roos_components/templates/components/button.html.j2 .. that works for Jinja.. but not for Java.. so.. how can we write the logic  
once.. and have it translated to targets? the logic often is not very difficult.. and it always outputs html ..                                                                                          
suggest how to do this.. this is an optional but mandatory step.. but rig script is not parsable by an editor.. so.. we need something that is.. would python work? or typescript? ...                   
it must be something we can read and parse.. and convert to the actual impelemntation language.. like jinja template.. or java template (which could be plain java).. or a react component.. if          
possible.. also.. we might or should be able to give 'type hints' perhaps.. as for react.. a button often 'extends' the basic button.. so.. maybe this is too hard to do..                               
But.. lets say it works.. and assume we get a jinja working solution.. then the abstract component.. becomes an implemented component.. and outputs html.. with the correct classes..                    
this means.. the implementation also must be standadlone per component.. all CSS used by it must be kept with the component.. it may use imports for definitions.. or tokens.. or whatever               
implementation specific is needed.. but the theme could be RVO with custom CSS.. or a tailwind based implementation.. it should not matter.. as long as the script tells what to do based on the         
properties...                                                                                                                                                                                            
Make a new plan.. Make it a very clean plan.. step by step and only for a few components to get this realized. We do not need to reuse what we have created so far, but lets use it for inspiration. 

We may need to iterate over the plan itself.. so.. in specs.. create a new plan with a version, but only if it seems the plan we made is not fully clear or is inconsistent. There is no need to change the plan if it is a good plan! If a plan already exist, create a new plan with a new version and READ the previous plans and check also the first implementation-spec.md file but note many things there are obsolet  and this prompt to see if this plan needs revisions.

Start with reading the suggested files in the specs folder.
