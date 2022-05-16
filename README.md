# shopify-image-challenge
This is a repository I made for Shopify data engineering intern challenge question (Fall 2022). It is a simple image gallery web app, which hosts a small repository of clothing/fashion images and allows the user to search for images based on keywords as text or by uploading an image. Currently, the website only classies images from 5 categories ('T-Shirt', 'Pants', 'Longsleeve', 'Dress', 'Shoes'), if your image contains one of these items it should classify it with high accuracy.


The website is a single page application, with a search bar to find specific images based on tags generated by clothing/fashion classification model. The search bar can take input in two ways either by comma seperated keywords such as "Shoes, T-shirt" or by uploading an image to server. To upload an image to server just drag and drop the image from your computer to the search bar area, the website will send image to server and get right tags back and search for images similar to those. 

# Web app components
  - Backend: The backend component (API) was developed using Flask and serves html pages using render templates.
  - Frontend: The templates of the page are designed from scratch using HTML and bootstrap-css to make a clean single page app that shows gallery of images. 
  - ML Model: The backend model used for classifying images and returning labels was designed using TensorFlow (Keras), The image dataset used to train classifier was from is from github alexygrigorev -> https://github.com/alexeygrigorev/clothing-dataset. More info about the model is in the clothing_classifer.ipynb file in repo. Its test accuracy is over 91%.
  - Docker: To create a simple process to run the whole project, docker was used. More info about docker is shown in the installation section.

# Installation:
  The repository includes a docker file, just run it on your personal computer,

  To run this project make sure you have docker installed, If you have it then open up terminal or command prompt type commands below:
  - docker-compose build --no-cache
  - docker-compose up -d
  - docker-compose up
  
 It should start a server instance on port 5000, just go to your borwser window and type
  - http://localhost:5000
  
 It should load up a website with some images already in it, if not then just take any image from your local directory and drag and drop them on the search bar. Once image is dropped it will start uploading process and return images on server which match the image metadata.
  


# IDEAS for future:
  - Use NLP based word vectors on keywords and tags to find image matches even if they are not the same strings
  - Increase number of labels the model can identify. Also make it identify multiple items from image.
  - Make it an image gallery which connects to your local computer and allows you to search for images based many different criteria
  - Add openCV support to serach for images based on different factors such as colors, gemoetry etc..
