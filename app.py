from flask import Flask, json, jsonify, request, render_template
from flask.wrappers import Response
from numpy.lib.type_check import imag
# import model
from keras.models import load_model
from keras.preprocessing.image import load_img
from keras.preprocessing.image import img_to_array
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
    # define the expected input shape for the model
    # load and prepare the image
    img_w, img_h = 64,64
    
    # load the image as grayscale
    img = load_img(file_path, grayscale=True, target_size=(img_w,img_h))
    # convert to array
    img = img_to_array(img)
    # reshape into a single sample with 1 channel, as we don't need very high quality images for training 
    img = img.reshape(img_w, img_h, 1)
    # prepare pixel data
    img = img.astype('float32')
    img = img / 255.0

    # make prediction
    pred = model.predict(img.reshape(1,img_w,img_h,1))

    # define the probability threshold for detected objects
    class_threshold = 0.8

    # define the labels
    labels = ['T-Shirt', 'Pants', 'Longsleeve', 'Dress','Shoes']

    return_data = []
    # get the right class lable for prediction
    if max(pred[0]) > class_threshold:
        pred_label = labels[np.argmax(pred)]
        # summarize what we found
        return_data = [pred_label]

    # image could not be classified into any category
    if len(return_data) == 0:
        os.remove(file_path)
        return json.dumps({
            "code" : "E003",
            "message" : "Image could not be classified, Try image of clothing items (pants, shirt,...)"
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
    model = load_model('best_model.h5')
    app.jinja_env.auto_reload = True
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    app.run(host='0.0.0.0')
