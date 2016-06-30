(function(win){
    var ImageWall = React.createClass({
        getDefaultProps: function(){
            return {
               images: []
            }    
        },
        
        onClick: function(image) {
            if (image.linkout) {
                window.open(image.linkout);
            }
        },
        
        render: function() {
            return (<div className="imagewall"><ul>
            {
                this.props.images.map(function(image, i) {
                    return (<li className="imagewall-item" key={i} style={{"background-image": "url("+image.url+")"}} onClick={this.onClick.bind(this, image)}></li>)
                }, this)
            }
            </ul></div>);
        }
    });
    
    
    win.ImageWall = ImageWall;
    
})(window)

