# naacl16-demo

Data, classifiers, and notebooks for the LIME demonstration at NAACL 2016

### Clone the repo and copy data

    git clone git@github.com:marcotcr/naacl-demo.git
    cd naacl-demo

Download [the models](https://drive.google.com/open?id=0ByblrZgHugfYSFYyMVFReUtDRGs) and copy models.tar.gz to naacl-demo

###Optional: start a virtualenv

    virtualenv ENV
    source ENV/bin/activate

### Install and unpack stuff:

    pip install lasagne lime flask theano 
    tar xvzf models.tar.gz
    
### Run the first demo (explanation, compare models):

    python server.py
    
### Run the second demo (feature engineering)    

    cd cleaning
    python server.py

### How we trained the models / data / etc

- getting embeddings:ver Getting word2vec stuff notebook
- Download the data from [here](https://drive.google.com/open?id=0ByblrZgHugfYODI3bUNYd3Fad1E)
- Unpack the data:
        tar xvzf datasets.tar.gz
- Run the following

        python learn_models.py                                                                    
        python run_submodular.py
        cd cleaning
        python generage_json.py
                                                                                                                                                                    
~                                                                                                                                                                                    
