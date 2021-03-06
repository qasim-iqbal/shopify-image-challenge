from flask import Flask, json, jsonify, request, render_template
from flask.wrappers import Response
from numpy.lib.type_check import imag
import model
from keras.models import load_model
import os
from PIL import Image
import exif 

# Variables/Constants declaration
app = Flask(__name__)
pretrained_model = None
ROOT_PATH = "./static/images"
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

    file_path = ROOT_PATH+"/"+file1.filename
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
    input_w, input_h = 416, 416
    # define our new photo

    # load and prepare image
    image, image_w, image_h = model.load_image_pixels(file_path, (input_w, input_h))
    # make prediction

    yhat = pretrained_model.predict(image)
    # summarize the shape of the list of arrays
    print([a.shape for a in yhat])
    # define the anchors
    anchors = [[116,90, 156,198, 373,326], [30,61, 62,45, 59,119], [10,13, 16,30, 33,23]]
    # define the probability threshold for detected objects
    class_threshold = 0.6
    boxes = list()
    for i in range(len(yhat)):
        # decode the output of the network
        boxes += model.decode_netout(yhat[i][0], anchors[i], class_threshold, input_h, input_w)
    # correct the sizes of the bounding boxes for the shape of the image
    # suppress non-maximal boxes
    model.do_nms(boxes, 0.5)

    # define the labels
    labels = ["person", "bicycle", "car", "motorbike", "aeroplane", "bus", "train", "truck",
        "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
        "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe",
        "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
        "sports ball", "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
        "tennis racket", "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana",
        "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
        "chair", "sofa", "pottedplant", "bed", "diningtable", "toilet", "tvmonitor", "laptop", "mouse",
        "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
        "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"]
    # get the details of the detected objects
    v_boxes, v_labels, v_scores = model.get_boxes(boxes, labels, class_threshold)
    # summarize what we found
    return_data = []
    for i in range(len(v_boxes)):
        return_data.append(v_labels[i])

    # image could not be classified into any category
    if len(return_data) == 0:
        os.remove(file_path)
        return json.dumps({
            "code" : "E003",
            "message" : "Image could not be classified"
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
    pretrained_model = load_model('model.h5')
    app.run(host='0.0.0.0')
