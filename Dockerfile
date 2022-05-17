FROM python:3.6-stretch
LABEL Author="Qasim Iqbal"

# install build utilities
RUN apt-get update && \
	apt-get install -y gcc make apt-transport-https ca-certificates build-essential

WORKDIR /shop-app

# Installing python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the files from the project’s root to the working directory
COPY . .

# RUN pip3 install -r requirements.txt
ENTRYPOINT ["python3"]
CMD ["-u","app.py"] 
# - u, shows the print statemnets from files executed in container's logs