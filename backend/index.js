const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const express = require('express');
const cors = require('cors');
const multer = require("multer");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const defaultPic = 'https://uscmbucket.s3.us-west-2.amazonaws.com/user.png';
const path = require("path");
const nodemailer = require('nodemailer');


dotenv.config();

const app = express();

const port = process.env.PORT || 6000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/client/build')));

app.use(cors({
    origin: process.env.APP_URL,
    credentials: true
}));


const bcrypt = require('bcrypt');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

app.use(cookieParser());

mongoose.connect(process.env.MONGODB_CONNECTION);

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
})

app.get("/api", (req, res) => {
    res.send("Express App is Running")
})

app.listen(port, '0.0.0.0', (error) => {
    if(!error) {
        console.log(`Server running on Port ${port}`)
    }
    else {
        console.log("Error: " + error)
    }
})

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + '_' + file.originalname);
        }
    })
});

app.post("/api/upload", upload.single("listing"), (req, res) => {
    res.json({
        success:1, 
        image_url: req.file.location
    }); 
})


const listingSchema  =  new mongoose.Schema({
    seller:{
        type: String,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    supplementalImages:{
        type:[String],
        default:[],
    },
    category:{
        type:String,
        required:true,
    },
    price: {
        type:Number,
        required:true,
    },
    condition: {
        type: String,
        required:true,
    },
    description: {
        type:String,
        default:"",
    },
    numLikes: {
        type: Number,
        default: 0,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    Available:{
        type:Boolean,
        default:true,
    },
})

const Listing = mongoose.model('Listing', listingSchema);

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model('Message', messageSchema);

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
    },
    messages: [messageSchema],
});

const Conversation = mongoose.model('Conversation', conversationSchema);



app.post("/api/remove-listing", async (req, res) => {
    
    const listingId = req.body.listingId;
    const userId = req.body.userId;
    try {
        const strId = listingId.toString();

       
        const user = await Users.findById(userId);
        user.listingData.delete(strId);
        await Listing.findByIdAndDelete(listingId);

        
        await user.save();
        
        await Users.updateMany(
            { likedListings: listingId },
            { $pull: { likedListings: listingId } }
        );
        
        const targetConversations = await Conversation.find({ listing: listingId });
        const messageIds = [];
        targetConversations.forEach(convo => {
            convo.messages.forEach(message => {
                messageIds.push(message._id);
            });
        });

        await Message.deleteMany({ _id: { $in: messageIds } });

        const conversationIds = targetConversations.map(convo => convo._id);
        await Conversation.deleteMany({ _id: { $in: conversationIds } });

        res.status(200).send({ message: 'Listing deleted successfully' });
    }
    catch (error) {
        console.error("Failed to delete listing", error);
        res.status(500).send({ message: 'Failed to delete listing' });
    }
});

app.post('/api/edit-listing', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'supplementalImages', maxCount: 10 }
]), async (req, res) => {
    const { userId, listingId, name, description, price, category, condition } = req.body;
    let imagesToRemove = req.body.imagesToRemove ? JSON.parse(req.body.imagesToRemove) : [];

    if (!mongoose.Types.ObjectId.isValid(listingId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: 'Invalid listing ID or user ID' });
    }

    try {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).send({ message: 'Listing not found' });
        }

        if (name) listing.name = name;
        if (description) listing.description = description;
        if (price) listing.price = price;
        if (category) listing.category = category;
        if (condition) listing.condition = condition;

        if (req.files.thumbnail) {
            listing.thumbnail = req.files.thumbnail[0].location;
        }

        if (req.files.supplementalImages) {
            const newSupplementalImages = req.files.supplementalImages.map(file => file.location);
            listing.supplementalImages = [...listing.supplementalImages, ...newSupplementalImages];
        }

        const extractBaseUrl = (url) => url.split('?')[0];

        if (imagesToRemove.length > 0) {
            listing.supplementalImages = listing.supplementalImages.filter(img => !imagesToRemove.includes(extractBaseUrl(img)));
        }

        await listing.save();

        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        user.listingData.set(listingId, listing.toObject());
        await user.save();

        res.status(200).send({ message: 'Listing updated successfully', listing });
    }
    catch (error) {
        console.error("Failed to edit listing", error);
        res.status(500).send({ message: 'Failed to edit listing' });
    }
});


app.post("/api/make-presignedURLs", async (req, res) => {
    const { listings } = req.body;

    try {
        const listingsWithUrls = await Promise.all(listings.map(async (listing) => {
            const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: listing.thumbnail.split('/').pop()
            }), { expiresIn: 3600 });

            const supplementalImagesUrls = await Promise.all(
                (listing.supplementalImages || []).map(async (image) => {
                    return await getSignedUrl(s3, new GetObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: image.split('/').pop()
                    }), { expiresIn: 3600 });
                })
            );

            return { ...listing, thumbnailUrl, supplementalImagesUrls };
        }));

        res.json(listingsWithUrls);
    }
    catch (error) {
        console.error("Error generating pre-signed URLs", error);
        res.status(500).json({ message: "Failed to generate pre-signed URLs" });
    }
});

app.get("/api/liked-listings/:userId", async (req, res) => {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).send({ message: 'Invalid user ID' });
    }

    try {
        const user = await Users.findById(userId).populate('likedListings');
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const likedListings = user.likedListings;

        const listingsWithUrls = await Promise.all(likedListings.map(async (listing) => {
            const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: listing.thumbnail.split('/').pop()
            }), { expiresIn: 3600 });

            return { ...listing.toObject(), thumbnailUrl };
        }));

        res.json(listingsWithUrls);
    }
    catch (error) {
        console.error("Failed to fetch liked listings", error);
        res.status(500).send({ message: 'Failed to fetch liked listings' });
    }
});


app.get("/api/categories", (req, res) => {
    const categories = ["Electronics", "Furniture", "Clothing", "Books", "Other"];
    res.json(categories);
});

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: { type: String, unique: true },
    password: String,
    profilePicture: { type: String, default: defaultPic },
    listingData: {
        type: Map,
        of: listingSchema,
        default: {},
    },
    likedListings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    date: { type: Date, default: Date.now }
});

const Users = mongoose.model('User', userSchema);

app.post("/api/signup", async (req, res) => {

    try {
        let check = await Users.findOne({ email: req.body.email });

    if (check) {
        return res.status(400).json({ success: false, errors: "An account already exists with this email" });
    }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const user = new Users({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });

        await user.save();

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
                
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        await sendWelcomeEmail(user.email, user.firstName);
        
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error with signup", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.post("/api/login", async (req,res) => {

    let user = await Users.findOne({ email:req.body.email });
   
    if (user) {
        const passwordCompare = await bcrypt.compare(req.body.password, user.password);
        if (passwordCompare) {
            const token = jwt.sign({ id: user._id, email: user.email}, process.env.JWT_SECRET);
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
            });
            res.json({ success: true});
        }
        else {
            res.json({success:false,errors:"Incorrect Password"});
        }
    }
    else {
        res.json({success:false,errors:"Incorrect Email address"});
    }
});

app.get("/api/user", authMiddleware, async (req, res) => {
    try {
        const user = await Users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let profilePictureUrl = user.profilePicture;
        
        if (profilePictureUrl && profilePictureUrl.startsWith('https://uscmbucket.s3.us-west-2.amazonaws.com/')) {
            const profilePictureKey = profilePictureUrl.split('/').pop();
            profilePictureUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: profilePictureKey
            }), { expiresIn: 3600 });
        }

        const userObject = user.toObject();
        userObject.listingData = Object.fromEntries(user.listingData);
        
        res.json({ ...userObject, profilePicture: profilePictureUrl });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/logout", async (req, res) => {

    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
    });
    res.json({ success: true });
});


app.post("/api/like", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { listingId } = req.body;

    try {
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const alreadyLiked = user.likedListings.some(likedListing => likedListing.equals(listing._id));
        if (!alreadyLiked) {
            user.likedListings.push(listing._id);
            listing.numLikes += 1;
            await user.save();
            await listing.save();
        }

        res.json({ success: true });
    }
    catch (error) {
        console.error("Error liking listing:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.post("/api/unlike", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { listingId } = req.body;

    try {
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const index = user.likedListings.findIndex(likedListing => likedListing.equals(listing._id));
        if (index > -1) {
            user.likedListings.splice(index, 1);
            listing.numLikes -= 1;
            await user.save();
            await listing.save();
        }

        res.json({ success: true });
    }
    catch (error) {
        console.error("Error unliking listing:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * Send a welcome email to new users upon successful sign-up.
 * @param {string} to - Recipient's email address.
 * @param {string} firstName - Recipient's first name.
 */
const sendWelcomeEmail = async (to, firstName) => {

    try {
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to,
            subject: 'Welcome to USC TrojanTrade!',
            text: `Hi ${firstName},\n\nThank you for signing up for Trojan Trade! We're excited to have you on board.\n\nBest regards,\nTrojan Trade Team`,
            html: `<p>Hi ${firstName},</p><p>Thank you for signing up for <strong>Trojan Trade</strong>! We're excited to have you on board.</p><p>Best regards,<br/>Trojan Trade Team</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent');
    }
    catch (error) {
        console.error('Failed to send welcome email:', error);
    }
};

/**
 * Send a notification email to recipients when they receive a new message.
 * @param {string} to - Recipient's email address.
 * @param {string} senderUsername - username of the sender.
 * @param {string} listingName - Name of the listing related to the message.
 */
const sendNotificationEmail = async (to, senderUsername, listingName) => {

    try {
        const mailOptions = { 
            from: process.env.EMAIL_ADRESS,
            to,
            subject: 'You have a new message on TrojanTrade!',
            text: `Hi,\n\nYou received a new message from ${senderUsername} regarding the listing "${listingName}".\n\nLog in to your account to view the message.\n\nBest regards,\nTrojan Trade Team`,
            html: `<p>Hi,<p> You recieved a new message from <strong>${senderUsername}</strong> regarding the listing "<strong>${listingName}</strong>".</p><p>Log in to your account to view the message.</p><p>Best regards,<br/>Trojan Trade Team</p>`
        };
        const message = await transporter.sendMail(mailOptions);
        console.log('Notification email sent', message);
    }
    catch (error) {
        console.error('Failed to send notification email:', error);
    }
};

module.exports = { sendWelcomeEmail, sendNotificationEmail };

app.post('/api/sendMessage', authMiddleware, async (req, res) => {

    const { content, listingId, recipientId } = req.body;
    const senderId = req.user.id;

    if (!content || !listingId || !recipientId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId] },
            listing: listingId,
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipientId],
                listing: listingId,
                messages: [],
            });
        }

        const newMessage = new Message ({
            sender: senderId,
            content: content,
        });

        await newMessage.save();
        conversation.messages.push(newMessage);
        await conversation.save();

        const recipient = await Users.findById(recipientId);
        const sender = await Users.findById(senderId);
        const listing = await Listing.findById(listingId);
        // (to, senderName, listingName)
        sendNotificationEmail(recipient.email, sender.username, listing.name);
        res.json({ success: true, conversation });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// endpoint to get all conversations where the user is a participant
app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        let conversations = await Conversation.find({ participants: userId })
            .populate('participants', 'username profilePicture')
            .populate('listing', 'name thumbnail')
            .populate('messages.sender', 'username profilePicture');

        // Sort conversations by the timestamp of the last message
        conversations = conversations.sort((a, b) => {
            const aLastMessageTime = a.messages[a.messages.length - 1]?.timestamp || 0;
            const bLastMessageTime = b.messages[b.messages.length - 1]?.timestamp || 0;
            return bLastMessageTime - aLastMessageTime;
        });

        res.json(conversations);
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post("/api/generatePresignedUrls", async (req, res) => {
    const { thumbnails } = req.body;

    try {
        const thumbnailsWithUrls = await Promise.all(thumbnails.map(async (thumbnail) => {
            const thumbnailKey = thumbnail.split('/').pop();
            const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: thumbnailKey,
            }), { expiresIn: 3600 });

            return { originalUrl: thumbnail, presignedUrl: thumbnailUrl };
        }));

        res.json(thumbnailsWithUrls);
    }
    catch (error) {
        console.error("Error generating pre-signed URLs", error);
        res.status(500).json({ message: "Failed to generate pre-signed URLs" });
    }
});


app.get('/api/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'username profilePicture')
            .populate('listing', 'name thumbnailUrl')
            .populate('messages.sender', 'username profilePicture');

        res.json(conversation);
    }
    catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.post("/api/upload-profile-picture", authMiddleware, upload.single("profilePicture"), async (req, res) => {
    const userId = req.user.id;
    const profilePictureUrl = req.file.location;

    try {

        const user = await Users.findById(userId);
        if (!user) {
            console.error("User not found");
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        user.profilePicture = profilePictureUrl;
        await user.save();
        res.json({ success: true, profilePicture: profilePictureUrl });
    }
    catch (error) {
        console.error("Failed to update profile picture:", error);
        res.status(500).json({ success: false, message: "Failed to update profile picture" });
    }
});


app.post("/api/update-user-listings", authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const newListing = req.body.listing;
    try {
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.listingData.push(newListing);
        await user.save();

        res.json({ success: true });
    }
    catch (error) {
        console.error("Failed to update user listings:", error);
        res.status(500).json({ success: false, message: "Failed to update user listings" });
    }
});


const uploadMultiple = upload.fields([
    
    { name: 'thumbnail', maxCount: 1 },
    { name: 'supplementalImages', maxCount: 10 }
]);

app.post("/api/addlisting", uploadMultiple, async (req, res) => {
   
    let thumbnail = req.files['thumbnail'] ? req.files['thumbnail'][0].location : "";
    let supplementalImages = req.files['supplementalImages'] ? req.files['supplementalImages'].map(file => file.location) : [];
    const userId = req.body.userId;


    const listing = new Listing({
        seller: userId,
        name: req.body.name,
        thumbnail: thumbnail,
        supplementalImages: supplementalImages,
        category: req.body.category,
        price: req.body.price,
        condition: req.body.condition,
        description: req.body.description
    });

    try {
        await listing.save();

        const user = await Users.findById(userId);

        if (user) {
            user.listingData.set(listing._id.toString(), listing);
            await user.save();
            res.json({ success: true, name: req.body.name });
        }
        else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } 
    catch (error) {
        console.error("Error saving listing:", error);
        res.status(500).json({ success: false, message: "Failed to save listing" });
    }
});


app.get("/api/all-listings", async (req, res) => {
    const category = req.query.category;

    try {
        let query = {};
        if (category && category !== 'All') {
            query.category = category;
        }

        let listings = await Listing.find(query);

        const listingsWithUrls = await Promise.all(listings.map(async (listing) => {
            const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: listing.thumbnail.split('/').pop()
            }), { expiresIn: 3600 });

            return { ...listing.toObject(), thumbnailUrl };
        }));

        res.json(listingsWithUrls);
    } 
    catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get('/api/search', async (req, res) => {
    const { query, category } = req.query;

    try {
        const regex = new RegExp(query, 'i');
        let searchCriteria = {
            $or: [
                { name: regex },
                { description: regex },
            ]
        };

        // If a category is selected, add it to the search criteria
        if (category && category !== 'All') {
            searchCriteria.category = category;
        }

        const listings = await Listing.find(searchCriteria);

        const listingsWithUrls = await Promise.all(listings.map(async (listing) => {
            const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: listing.thumbnail.split('/').pop()
            }), { expiresIn: 3600 });

            return { ...listing.toObject(), thumbnailUrl };
        }));

        res.json(listingsWithUrls);
    }
    catch (error) {
        console.error('Error fetching search results:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/api/get-seller-details', async (req, res) => {
    
    const sellerId = req.body.seller;
    
    try {
        const seller = await Users.findById(sellerId);
        const profilePictureUrl = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: seller.profilePicture.split('/').pop()
        }), { expiresIn: 3600 });

        const listingDataSize = seller.listingData.size;

        const sellerObject = seller.toObject();
        sellerObject.listingData = Object.fromEntries(seller.listingData);
        res.json({ 
            ...sellerObject, 
            profilePictureUrl, 
            listingDataSize 
        });
    }
    catch (error) {
        console.error('Error fetching seller details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get("/api/top-listings", async (req, res) => {
    try {
        // Find the top 5 listings sorted by number of likes in descending order
        let listings = await Listing.find().sort({ numLikes: -1 }).limit(4);

        const listingsWithUrls = await Promise.all(listings.map(async (listing) => {
            const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: listing.thumbnail.split('/').pop()
            }), { expiresIn: 3600 });
            
            return { ...listing.toObject(), thumbnailUrl };
        }));

        res.json(listingsWithUrls);
    }
    catch (error) {
        console.error("Error fetching top listings:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.get('/api/listing/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const thumbnailUrl = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: listing.thumbnail.split('/').pop()
        }), { expiresIn: 3600 });   

        const supplementalImagesUrls = await Promise.all(listing.supplementalImages.map(async (image) => {
            return await getSignedUrl(s3, new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: image.split('/').pop()
            }), { expiresIn: 3600 });
        }));

        res.json({ ...listing.toObject(), thumbnailUrl, supplementalImagesUrls });
    }
    catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/client/build/index.html'));
});