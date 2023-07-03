// cancel button in view orders page

<% if(orders.status!== 'Cancelled') { %>
  <td><a class="btn btn-sm btn-danger" href="/orderCancelled/<%= orders._id %>">Cancel</a></td>
    <% } else { %>
     <td>Order Cancelled</td>
    <% } %>


    exports.cancel_order = async (req, res) => {
      try {
        const user = req.session.user;
        const userId = req.session.user?._id;
        const orderId = req.params.id;
    
        // Display SweetAlert confirmation before cancelling the order
        Swal.fire({
          title: 'Are you sure?',
          text: 'This action cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, cancel it!',
          cancelButtonText: 'No, keep it'
        }).then(async (result) => {
          if (result.isConfirmed) {
            // If the user confirms the cancellation, proceed with the cancellation logic
            const deletedOrder = await order.findByIdAndUpdate({ _id: orderId }, { status: 'Cancelled' }, { new: true });
    
            if (deletedOrder) {
              console.log('Order deleted successfully');
              res.redirect('/user/vieworders');
            } else {
              console.log('Order deletion failed');
            }
          }
        });
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: error.message || 'Some error occurred while cancelling an order' });
      }
    };








     //cancel orders
exports.cancel_order = async(req, res) =>{
  try{
      const user = req.session.user;
      const userId  = req.session.user?._id;
      const orderId = req.params.id;

      

      const deletedOrder = await order.findByIdAndUpdate({_id : orderId},{
          status : "Cancelled"
      },{new : true})
      if(deletedOrder){
          console.log('Order deleted succeessfully');
          res.redirect('/user/vieworders')
      }else{
          console.log('Order deletion failed');
      }
  }catch(error){
      console.log(error);
      res.status(500).send({message : error.message || "some error occured while  cancelling an order "})
  }
}

//updating category
exports.updateCategory = async (req,res) => {
  try{
          const id = req.params.id;
          const Category = req.body.category;
          const Description = req.body.description;
          const updatedCategory = await category.findByIdAndUpdate(id,
              {
                  category : Category,
                  description : Description
              },{new : true})
      
             if(updatedCategory){
              console.log('category updated');
              console.log(updatedCategory);
              res.redirect('/categories')
             }else{
              res.send('can not update category')
             }
 
  }catch(error){
      console.log(error);
      res.status(500).send({message : error.message||'some error occured while updating category' })
  }
  

}

//adding categories
exports.add_Category = async (req,res) => {
  try{
    const newCategory = new category({
        category: req.body.category,
        description : req.body.description
    })
    console.log(newCategory);
    await newCategory.save()
    res.redirect('/categories')
  }catch(error){
    console.log(error);
    res.render('admin/404error',{errMsg : 'error while adding category'})
    // res.status(500).send({
    //     message : error.message || "some error occured while creating category"
    // })
  }
}

exports.refund = async (req, res) => {
  const { id } = req.params

  try {
    const order = await orderSchema.findById(id).populate({ path: "items.product" })
    console.log("refund id:",id);
    console.log(order);

    if(!order) {
      return res.status(404).send({ message: "Order not found" })
    }

    const wallet = await walletSchema.findOne({ userId: order.user })

    if(wallet) {
      // User's wallet already exists, update the balance
      wallet.balance += order.total

      wallet.transactions.push(order.payment_method)

      await wallet.save()
    } else {
      const newWallet = new walletSchema({
        userId: order.user,
        orderId: order._id,
        balance: order.total,
        transactions: [order.payment_method]
      })

      await newWallet.save()
    }

    await orderSchema.updateOne({ _id: id }, { $set: { status: 'Amount refunded' } })

    res.redirect('/orders')
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
}


exports.user_wallet = async (req, res) => {
  if(req.session.user){
    try {
      const userId = req.session.user?._id
      const user = req.session.user
      let sum = 0

      const walletbalance = await walletSchema.findOne({ userId: userId }).populate('orderId');
      const orderdetails = await orderSchema.find({ user: userId , status: "Amount refunded" }).populate('items.product');

      if (walletbalance) {
        sum += walletbalance.balance;
        const wallet = walletbalance.orderId
        res.render("user/user_wallet", { user, wallet, sum, walletbalance, orderdetails })
      } else {
        res.render('user/user_wallet', { user, wallet: null, sum, walletbalance: null, orderdetails });
      }


    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  } else {
    res.redirect("/login")
  }
}

exports.wallet_pay = async(req,res)=>{
  if(req.session.user){
    try{
      const userId = req.session.user._id
      const wallet = await walletSchema.findOne({ userId: userId });
      const cart = await cartSchema.findOne({userId:userId}).populate("products.productId")
      let totalprice=0
  
      const items = cart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = item.productId.price
          
        totalprice += price * quantity;   
      })
  
      console.log(totalprice,"kk q");
      const balance = (10 / 100) * totalprice;
  
      let wallet_balance= wallet.balance
      if (balance <  wallet.balance) {
        totalprice -= balance;
        cart.wallet = balance;
        await cart.save();
       
        wallet.balance -= balance
  
        console.log( wallet.balance,"before");
        await wallet.save();
        console.log( wallet.balance,"after");
      }
      res.json({
        success: true,
        message: "Wallet add Successful",
        totalprice,
        wallet_balance
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login")
  }
};


//getting products page
exports.shop = async (req, res) => {
  try {
    const Category = req.query.category;
    console.log(Category);
    const search = req.query.search;

    let productQuery = {};

    if (Category) {
      productQuery.category = Category;
    }
    
    if (search) {
      productQuery.name = { $regex: new RegExp(search, 'i') };
    }

    const data = await category.find();
    const product = await products.find(productQuery);
    const user = req.session.user;

    if (product) {
      res.render('user/shop', { product, user, data, selectedCategory: Category });
    } else {
      res.send("Cannot find products from the database.");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while finding shop",
    });
  }
};




//carousel for single product page
<!-- new -->
<div class="site-section  bg-white">
  <div class="container">
    <div class="row">
      <div class="col-md-6 stretch-card">
        <div
          id="carouselExample-cf"
          class="carousel carousel-dark slide carousel-fade"
          data-bs-ride="carousel"
        >

       
          <ol class="carousel-indicators">
           
            <li data-bs-target="#carouselExample-cf" data-bs-slide-to="0" class="active"></li>
            <li data-bs-target="#carouselExample-cf" data-bs-slide-to="1"></li>
            <li data-bs-target="#carouselExample-cf" data-bs-slide-to="2"></li>
          </ol>

          <div class="carousel-inner bg-light">
            
            <div class="carousel-item active easyzoom easyzoom--overlay">
              <img src="/<%= product.image[0]%> " alt="Image"  class="mainimage d-block w-100 img-fluid border border-light">
            </div>
           

            <div class="carousel-item easyzoom easyzoom--overlay">
              <img src="/<%= product.image[1] %>" alt="Image" class="mainimage d-block w-100 img-fluid border border-light" >
            </div>

            <div class="carousel-item easyzoom easyzoom--overlay">
              <img src="/<%= product.image[2] %>" alt="Image" class="mainimage d-block w-100 img-fluid border border-light">
            </div>
          </div>

          <a class="carousel-control-prev" href="#carouselExample-cf" role="button" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </a>
          <a class="carousel-control-next" href="#carouselExample-cf" role="button" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </a>
        </div>
    
      </div>

      <div class="col-md-6">
        <h2 class="text-black product-name" title="<%= product.name %>"><%= product.name %></h2>
        <p class=""><%= product.description %></p>
        <p class="mb-4"></p>
        <p><strong class="text-primary h4"> ₹ <%= product.price %></strong></p>
        <div class="mb-5">
        </div>

        <div class="d-flex">
         
          <p><a href="/addToCart/<%= product._id %>" class="buy-now btn btn-sm btn-primary" id="addToCartButton">Add To Cart</a></p>
      
         
        </div>
      </div>
    </div>
  </div>
</div>