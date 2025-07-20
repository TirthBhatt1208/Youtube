/* what this asnyc hendeler function do??
    first suppose requestHandlerFunction this is one paramaeter
    second we will exicute inner function that will check parameter function
    third requestHandlerFunction will be run if error comes it will goes to catch block
    then promise will be retured
*/

const asyncHandler = (requestHandlerFunction) => {
    return (req , res , next) => {
        Promise
        .resolve(requestHandlerFunction(req , res , next))
        .catch( (error) => next(error) );
    }
}

export { asyncHandler }





/*
const asnycHandler = (fn) => async (req , res , next) => {
    try {
        return await fn(req , res , next);
    } catch (error) {
        res.status(error.code || 500).json( {
            success: false,
            massage: error.massage
        } )
    }
}
*/