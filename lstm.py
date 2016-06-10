
def GetLSTM():
    import sys
    sys.path.append('iclr2016/main')
    sys.path.append('iclr2016/sentiment')
    import cPickle
    import ppdb_utils
    import evaluate
    from lstm_model_sentiment import lstm_model_sentiment
    import params
    import time
    import numpy as np
    import numpy.random
    import random
    import argparse
    import lasagne
    import utils
    def str2bool(v):
        if v is None:
            return False
        if v.lower() in ("yes", "true", "t", "1"):
            return True
        if v.lower() in ("no", "false", "f", "0"):
            return False
        raise ValueError('A type that was supposed to be boolean is not boolean.')
    
    def learner2bool(v):
        if v is None:
            return lasagne.updates.adam
        if v.lower() == "adagrad":
            return lasagne.updates.adagrad
        if v.lower() == "adam":
            return lasagne.updates.adam
        raise ValueError('A type that was supposed to be a learner is not.')

    random.seed(1)
    np.random.seed(1)
    
    params = params.params()
    
    parser = argparse.ArgumentParser()
    parser.add_argument("-LW", help="Lambda for word embeddings (normal training).", type=float)
    parser.add_argument("-LC", help="Lambda for composition parameters (normal training).", type=float)
    parser.add_argument("-outfile", help="Output file name.")
    parser.add_argument("-batchsize", help="Size of batch.", type=int)
    parser.add_argument("-dim", help="Size of input.", type=int)
    parser.add_argument("-memsize", help="Size of classification layer.",
                        type=int)
    parser.add_argument("-wordfile", help="Word embedding file.")
    parser.add_argument("-layersize", help="Size of output layers in models.", type=int)
    parser.add_argument("-updatewords", help="Whether to update the word embeddings")
    parser.add_argument("-wordstem", help="Nickname of word embeddings used.")
    parser.add_argument("-save", help="Whether to pickle the model.")
    parser.add_argument("-traindata", help="Training data file.")
    parser.add_argument("-devdata", help="Training data file.")
    parser.add_argument("-testdata", help="Testing data file.")
    parser.add_argument("-peephole", help="Whether to use peephole connections in LSTM.")
    parser.add_argument("-outgate", help="Whether to use output gate in LSTM.")
    parser.add_argument("-nonlinearity", help="Type of nonlinearity in projection and DAN model.",
                        type=int)
    parser.add_argument("-nntype", help="Type of neural network.")
    parser.add_argument("-evaluate", help="Whether to evaluate the model during training.")
    parser.add_argument("-epochs", help="Number of epochs in training.", type=int)
    parser.add_argument("-regfile", help="Path to model file that we want to regularize towards.")
    parser.add_argument("-minval", help="Min rating possible in scoring.", type=int)
    parser.add_argument("-maxval", help="Max rating possible in scoring.", type=int)
    parser.add_argument("-LRW", help="Lambda for word embeddings (regularization training).", type=float)
    parser.add_argument("-LRC", help="Lambda for composition parameters (regularization training).", type=float)
    parser.add_argument("-traintype", help="Either normal, reg, or rep.")
    parser.add_argument("-clip", help="Threshold for gradient clipping.",type=int)
    parser.add_argument("-eta", help="Learning rate.", type=float)
    parser.add_argument("-learner", help="Either AdaGrad or Adam.")
    parser.add_argument("-task", help="Either sim, ent, or sentiment.")
    parser.add_argument("-numlayers", help="Number of layers in DAN Model.", type=int)
    parser.add_argument("-input", help="Fine with list of sentences to classify.")
    args = parser.parse_args(['-wordstem', 'simlex', '-wordfile', 'iclr2016/data/paragram_sl999_small.txt', '-outfile', 'gpu-lstm-model', '-dim', '300', '-layersize', '300', '-save', 'False', '-nntype', 'lstm_sentiment', '-evaluate', 'True', '-epochs', '10', '-peephole', 'True', '-traintype', 'rep', '-task', 'sentiment', '-updatewords', 'True', '-outgate', 'True', '-batchsize', '25', '-LW', '1e-06', '-LC', '1e-06', '-memsize', '300', '-learner', 'adam', '-eta', '0.001', '-regfile', 'iclr2016/sentiment_2.pickle', '-input', 'iclr2016/input.txt'])
    params.LW = args.LW
    params.LC = args.LC
    params.outfile = args.outfile
    params.batchsize = args.batchsize
    params.hiddensize = args.dim
    params.memsize = args.memsize
    params.wordfile = args.wordfile
    params.nntype = args.nntype
    params.layersize = args.layersize
    params.updatewords = str2bool(args.updatewords)
    params.wordstem = args.wordstem
    params.save = str2bool(args.save)
    params.traindata = args.traindata
    params.devdata = args.devdata
    params.testdata = args.testdata
    params.usepeep = str2bool(args.peephole)
    params.useoutgate = str2bool(args.outgate)
    params.nntype = args.nntype
    params.epochs = args.epochs
    params.traintype = args.traintype
    params.evaluate = str2bool(args.evaluate)
    params.LRW = args.LRW
    params.LRC = args.LRC
    params.learner = learner2bool(args.learner)
    params.task = args.task
    params.numlayers = args.numlayers
    params.input = args.input
    
    if args.eta:
        params.eta = args.eta
    
    params.clip = args.clip
    if args.clip:
        if params.clip == 0:
            params.clip = None
    
    params.regfile = args.regfile
    params.minval = args.minval
    params.maxval = args.maxval
    
    if args.nonlinearity:
        if args.nonlinearity == 1:
            params.nonlinearity = lasagne.nonlinearities.linear
        if args.nonlinearity == 2:
            params.nonlinearity = lasagne.nonlinearities.tanh
        if args.nonlinearity == 3:
            params.nonlinearity = lasagne.nonlinearities.rectify
        if args.nonlinearity == 4:
            params.nonlinearity = lasagne.nonlinearities.sigmoid
 
    (words, We) = ppdb_utils.getWordmap(params.wordfile)
    model = lstm_model_sentiment(We, params)
    import re
    def PredictProbaFn(X):
        preds = []
        seq1 = []
        ct = 0
        for i in X:
            p1 = i.strip()
            p1 = ' '.join(re.split('(\W+)', p1))
            X1 = evaluate.getSeq(p1,words)
            seq1.append(X1)
            ct += 1
            if ct % 100 == 0:
                x1,m1 = utils.prepare_data(seq1)
                scores = model.predict_proba(x1,m1)
                if scores.shape[0] > 1:
                    scores = np.squeeze(scores)
                preds.extend(scores.tolist())
                seq1 = []
        if len(seq1) > 0:
            x1,m1 = utils.prepare_data(seq1)
            scores = model.predict_proba(x1,m1)
            if scores.shape[0] > 1:
                scores = np.squeeze(scores)
            preds.extend(scores.tolist())
        preds = np.array(preds).reshape(-1, 1)
        return np.hstack((1 - preds, preds))
    return PredictProbaFn
