from flask import Flask, json, jsonify, request, render_template
from flask.wrappers import Response
from numpy.lib.type_check import imag
from sklearn.feature_extraction import img_to_graph
import tensorflow as tf
from keras.models import load_model
# from keras.preprocessing.image import load_img
# from keras.preprocessing.image import img_to_array
import os
from PIL import Image
import exif 
import numpy as np
import uuid

# Variables/Constants declaration
app = Flask(__name__)
pretrained_model = None
ROOT_PATH = "static/images"
MAX_IMAGES_ON_SERVER = 50


# API routes
@app.route("/")
def index_page():
    return render_template("index.html")

@app.route("/get_labels", methods=['POST'])
def model_prediction():

    # check if key is correct
    if 'image_in' not in request.files:
        return json.dumps({
            "code" : "E001",
            "message": "Incorrect form-data key"
        })

    # save the file
    files = os.listdir(ROOT_PATH)
    file1 = request.files['image_in']

    unique_filename = str(uuid.uuid4())
    file_path = ROOT_PATH+"/"+unique_filename+'.jpg'
    file1.save(file_path)

    try:
        im = Image.open(file_path)
        im.verify()
    except:
        os.remove(file_path) # remove the file
        return json.dumps({
            "code" : "E002",
            "message": "Incorrect file type"
        })

    print("file uploaded")
    img_height, img_width = 224, 224
    # define the expected input shape for the model
    # load and prepare the image
    img = tf.keras.utils.load_img(
        file_path, target_size=(img_height, img_width)
    )

    img_array = tf.keras.utils.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0) # Create a batch

    # define the labels
    labels = ['Dress', 'Longsleeve', 'Pants', 'Shoes', 'T-Shirt']

    predictions = model.predict(img_array)
    score = tf.nn.softmax(predictions[0])


    # define the probability threshold for detected objects
    class_threshold = 0.6

    return_data = []
    # get the right class lable for prediction
    if np.max(score) > class_threshold:
        pred_label = labels[np.argmax(score)]
        # summarize what we found
        return_data = [pred_label]

    # image could not be classified into any category
    if len(return_data) == 0:
        os.remove(file_path)
        return json.dumps({
            "code" : "E003",
            "message" : "Image could not be classified, Try image of clothing items (pants, shirt, ...)"
        })

    img_files = os.listdir(ROOT_PATH)
    if len(img_files) <= MAX_IMAGES_ON_SERVER: # max limit of images on page
        # resize all images to same aspect ratio before saving,
        img = Image.open(file_path)
        img = img.resize((400,400),Image.ANTIALIAS)

        img.save(file_path,"JPEG",quality=90)
        
        # add tags to image description, once the Image processing is done
        with open(file_path, 'rb') as image_file:
            my_image = exif.Image(image_file)

        my_image.image_description = str(return_data)

        with open(file_path, 'wb') as new_image_file:
            new_image_file.write(my_image.get_file())
    else:
        os.remove(file_path)

    return json.dumps({
        "code" : "S000",
        "message": return_data
    })

@app.route("/images")
def get_Images_Names():
    files = os.listdir(ROOT_PATH)
    return jsonify(files)

if __name__ == "__main__":
    # load yolov3 models
    model = load_model('./models/best_model.h5')
    app.jinja_env.auto_reload = True
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host='0.0.0.0')
