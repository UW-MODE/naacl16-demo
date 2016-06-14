# naacl-demo

### Clone the repo and copy data

    git clone git@github.com:marcotcr/naacl-demo.git 
    download models.tar.gz at https://drive.google.com/open?id=0ByblrZgHugfYSlZYT3pnQ2U4Znc
    copy models.tar.gz to naacl-demo

###Optional: start a virtualenv

    virtualenv ENV
    source ENV/bin/activate

### Install stuff:

    pip install lasagne lime flask theano 
    tar xvzf models.tar.gz
    python server.py
    cd cleaning
    python server.py

### How we trained the models / data / etc

- getting embeddings:ver Getting word2vec stuff notebook
- Run the following

        python learn_models.py                                                                    
        python run_submodular.py
        cd cleaning
        python generage_json.py
                                                                                                                                                                    
~                                                                                                                                                                                    
