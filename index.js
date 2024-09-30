const app = require("./app.js")
const {connectDB} = require("./db/index.js");
const port = process.env.PORT || 8000

process.on("uncaughtException", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down the server due to uncaughtException Error `);
  process.exit(1);
});

//Database Connection
connectDB().then(() => {
    const server = app.listen(port, () => {
        console.log(`⚙️ Server is running at port : ${port}`);
    })
    app.set('views', './views');
    app.set('view engine', 'ejs');

    app.get("/apps/products", (req,res,next)=>{
        const products = [
                {
                    "description": "Handmade in Italy, the Peekaboo Iconic Mini Beaded Floral Tote Bag is made of soft purple lambskin leather with multicolor beaded floral embroidery, paired with gold-finish metalware that adds a posh feel. It features the iconic twist lock closure on both sides, that opens to two inner compartments lined in tone on tone soft lambskin leather separated by a stiff partition, with dual pockets for your phone and keys. Make a fashion statement with Fendi's Peekaboo bag, a one-off piece a collector shouldn't miss! CONDITION: Excellent with minimal sign of wear ORIGIN: Made in Italy DIMENSIONS: 17x24x10 cm MATERIAL: 100% Lambskin leather | Embroidery: 1:100% glass | Lining:100% lambskin leather PACKAGING: Fendi authenticity card and dust bag PRODUCT ID: SVSGBG86024",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/2595960baf88f8a80efba0c1d6dec35a.jpg?v=1711956850"
                    },
                    "title": "Peekaboo Iconic Mini Beaded Floral Tote Bag111111222222222"
                },
                {
                    "description": "Channel glamour and sophistication with the Bottega Veneta Knot Clutch. Featuring dazzling silver sequins, this clutch is a true statement piece that will elevate any look. The iconic knot lock adds a chic touch, while the brown compact suede interior offers a luxurious finish. Perfect for special occasions or evenings out, this clutch is a must-have accessory for those who want to make a bold and stylish impression. Bottega Veneta Knot Clutch in Black and Silver Sequin Condition: Excellent with dust bag Sign of wear: No Material: Sequin Color: Silver Dimensions: Length: 100 mm, Width: 160 mm, Height: 40 mm SKU: 358758 / NAPBKGBBA345400W Collection ID: 26327",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/dee707e90b3d325868cde1015b1681a1.jpg?v=1711962516"
                    },
                    "title": "Bottega Veneta Knot Clutch in Black and Silver Sequin"
                },
                {
                    "description": "100% Silk, Diane von Furstenberg light summer dress, sleeveless, with back belt and adjustable straps.",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/edt-891e3180021396f0de279255dddabea4.jpg?v=1711962564"
                    },
                    "title": "Multicolor Print Silk Sleeveless Dress"
                },
                {
                    "description": "Stella McCartney Red and Blue Floral Skirt in very good condition with light wear throughout. Constructed with a zipper opening in front. Made in Hungary,",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/edt-fa773baba1ad5503303e9f18ea2bd439.jpg?v=1711962921"
                    },
                    "title": "Red and Blue Floral Skirt"
                },
                {
                    "description": "Self-Portrait Red Ribbed Mini Dress in very good condition with light wear throughout. Crafted with ribbed material with a button opening in front at the chest area. Made in China.",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/edt-e345f1fa1db8bc8aba904e68fb8165dd.jpg?v=1711963660"
                    },
                    "title": "Red Ribbed Mini Dress"
                },
                {
                    "description": "Timeless and Iconic Design. Tweed Black and White Jacket with Mesh Tulle and lace. 100% Silk lining. Crop design. In very good vintage condition - there is small fading to yellow ( on the white elements)",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/edt-9e4d270d00af61f77deb86af70d768ae.jpg?v=1711964339"
                    },
                    "title": "Black and White Tweed and Lace Jacket"
                },
                {
                    "description": "ACNE STUDIOS Open Back Pumps",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/044fe6d5414479a4bbd6d90f0390bf93_94cc7180-cbb1-425a-b0a0-845fc5bb0cb8.jpg?v=1715671263"
                    },
                    "title": "ACNE STUDIOS Open Back Pumps"
                },
                {
                    "description": "Featuring a white, black and red colourway, these Air Jordan 1 Low SE Utility sneakers by Nike are designed with a protective canvas upper in white with black overlays, and red contrast stitching all-around. They're finished with the logo detail, clean midsole and a rubber outsole. Air Jordan 1 Low SE Utility sneakers in White Black Gym Red Canvas Condition: excellent Material: Canvas Size: US7 Sign of wear: No SKU: 209909 Collection ID: 15158",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/e6ba7b86358e244f44a2821485cf44c3.jpg?v=1711966274"
                    },
                    "title": "Air Jordan 1 Low SE Utility sneakers in White Black Gym Red Canvas"
                },
                {
                    "description": "The Celine CL40198F square frame sunglasses is crafted from glossy black acetate, creating a look that is both modern and timeless. Each bold frame features a tonal lens filter category 3, making it perfect for everyday use. These glasses have been made in Italy and features the brand logo on each arm. Celine CL40198F Square Sunglasses in Black Acetate Condition: Excellent with leather case and box Sign of wear: Light wear, no visible defects Material: Acetate Color: Black Size: Width: 150 mm Length: 150 mm Height: 55 mm SKU: 283099 Collection ID: 22687",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/519fe872ebced816e23570e7a5333cd5-Copy.jpg?v=1711966839"
                    },
                    "title": "Celine CL40198F Square Sunglasses in Black Acetate"
                },
                {
                    "description": "100% silk tie in burgundy spotted pattern. In very good condition. Made in Italy",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/c9f7d1693a3d54fc4dfe2ae690cb14ac.jpg?v=1711967045"
                    },
                    "title": "AIGNER Burgundy Spotted Tie"
                },
                {
                    "description": "Anton Heunis Crystal Necklace in very good condition with faint scratches throughout. Gold chunky links and with T-bar closure. Perfect statement piece to elevate outfit for various occasion.",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/3be0f201aff09c811042da5fbd5f0153.jpg?v=1711967561"
                    },
                    "title": "Anton Heunis Crystal Necklace"
                },
                {
                    "description": "Anton Heunis Crystal Necklace in very good condition with faint scratches throughout. Gold chunky links and with T-bar closure. Perfect statement piece to elevate outfit for various occasion.",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/3be0f201aff09c811042da5fbd5f0153.jpg?v=1711967561"
                    },
                    "title": "Anton Heunis Crystal Necklace"
                },
                {
                    "description": "This Bottega Veneta ring is visually stunning and finely created to last. Meticulously crafted from silver, the piece carries a unique touch of the brand's Intrecciato pattern, which reflects a weaving effect. This ring is just the perfect accessory to add an elegant yet contemporary touch to your look. With box. Bottega Veneta Intrecciato Band Ring in Silver Metal Condition: very good Material: metal Size: one size Width: 7mm Length: 49mm Sign of wear: discolorations SKU: 346941 Collection ID: 26369",
                    "featuredImage": {
                        "src": "https://cdn.shopify.com/s/files/1/0814/4738/7454/files/1b9ea8813140be7ba0b5efd0821b56f0_1.jpg?v=1711967766"
                    },
                    "title": "Bottega Veneta Intrecciato Band Ring in Silver Metal"
                }
        ]

        return res.status(200).json({
            success: true,
            product: products
        })
        
    })

    process.on("unhandledRejection" , (err)=>{
        console.log(`Error: ${err.message}`)
        console.log(`Shutting down the server due to Unhandled Promise Rejection`);
    
        server.close(()=>{
            process.exit(1)
        })
    })
})
.catch((err) => {
    console.log("db connection failed !!! ", err);
})

