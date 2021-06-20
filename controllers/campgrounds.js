const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken});
const {cloudinary} = require('../cloudinary');

module.exports.index = async (req,res)=>{
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index',{campgrounds} );
}

module.exports.renderNewForm = (req,res)=>{
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req,res,next) =>{
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send();
    const campground = new Campground(req.body.campground);
    if(geoData.body.features[0].geometry===null){
        req.flash('error', 'Invalid Location');
        return res.redirect('/campgrounds/new');
    }
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename}))
    campground.author = req.user._id;
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;
    campground.date = today
    await campground.save();
    req.flash('success', 'Successfully made a new campground')
    res.redirect(`/campgrounds/${campground._id}`);    
    console.log(campground);   
}

module.exports.showCampground = async (req,res)=>{
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    console.log(campground);
    if(!campground){
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campground});
}

module.exports.renderEditForm = async(req,res)=>{
    const campground = await Campground.findById(req.params.id);
    if(!campground){
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', {campground});
}

module.exports.updateCampground = async (req,res)=>{
    const {id} = req.params;
    console.log(req.body)
    const campground = await Campground.findByIdAndUpdate(id,{...req.body.campground});
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy;
    campground.date.updateOne(today);
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename}));
    campground.images.push(...imgs);
    if(req.body.deleteImages){
        for( let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: {filename: { $in: req.body.deleteImages }}}})
        console.log(campground)
    }
    await campground.save();
    req.flash('success','Succesfully updated campground')
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async(req,res)=>{
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campgrounds')
    res.redirect('/campgrounds');
}