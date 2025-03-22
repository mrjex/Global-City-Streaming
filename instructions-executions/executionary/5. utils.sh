#####     5. UTILS    #####

#   - This is script isn't directly related to any end-goal due to its broader area of
#     usage: A generalization of similar behavior with different variables/data. The general
#     functionality found in this file allows for reusability in "5. equator.combinations.sh",
#     "5. bubbleChart-combinations.sh" and "5. pieChart-combinations.sh"


##  Debugging colors  ##
NO_COLOR='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'


# Function:
#   - The generalized behavior of iterating through an array pre-determined sequential elements,
#     and in order, replace the previous (i - 1)th value with the current (i)th value inside a
#     given input file using the 'sed' command. At first, the element at index 0 is replaced
#     with the actual value to create an entrypoint for the sequential replacement-array to
#     start from.
#
# Arguments:
#   - ARG 1: File to manipulate
#   - ARG 2: Initial value to replace (the already existing value prior to the manipulation procedure)
#   - ARG 3: Array of strings to replace
#   - ARG 4: The denotation that describes the combination's distinguishing domain
#   - ARG 5: The argument for '4. data-visualization.sh', indicating what chart(s) to visualize. If
#            multiple parameters are passed they must be space-separated
#
# Usages & Concrete attributes:
#   - equator-combinations.sh --> runUtilsCombinations "../../configuration.yml" "Europe" "${CONTINENTS}" "continent" "equatorChart=True"
#   - pieChart-combinations.sh --> runUtilsCombinations A B "${CONTINENTS[@]}" D E
#   - bubbleChart-combinations.sh --> runUtilsCombinations A B C D E
#
runUtilsCombinations() {

    # Parse the comma-separated string of the passed array's elements into an indexed array
    ARR_ARG=${3}
    ARRAY_REPLACEMENTS=(${ARR_ARG//,/ })

    # Read args
    CONFIG_FILE=${1}
    DENOTATION=${4}
    CHARTS_TO_VISUALIZE=${5}

    # Run initial combination, with the 0th index as starting value
    configureCombination "${DENOTATION}" "${2}" "${ARRAY_REPLACEMENTS[0]}" "${CONFIG_FILE}"
    visualizeCombination "${DENOTATION}" "${ARRAY_REPLACEMENTS[0]}" "${CHARTS_TO_VISUALIZE}"

   
    LAST_IDX=$((${#ARRAY_REPLACEMENTS[@]} - 1))

    # Iterate over all elements excluding the first element
    for i in $(seq 1 "${LAST_IDX}")
    do
        PREV_V=${ARRAY_REPLACEMENTS[$(($i - 1))]}   # Previous Value
        CURR_V=${ARRAY_REPLACEMENTS[${i}]}          # Current Value


        configureCombination "${DENOTATION}" "${PREV_V}" "${CURR_V}" "${CONFIG_FILE}"
        visualizeCombination "${DENOTATION}" "${CURR_V}" "${CHARTS_TO_VISUALIZE}"
    done
}



# Function:
#   - Replaces the previous value with the current value of a given file by
#     searching for a sequential chain of characters, and then substituting
#     that string with the specified new replacement-string. I.e this
#     function searches for a pattern in a file and manipulates its contents
#
# Arguments:
#   - ARG 1: A string representative of the combination
#   - ARG 2: The string to replace
#   - ARG 3: The replacement string
#   - ARG 4: The given file to manipulate
#
configureCombination() {
    DENOTATION=${1}
    OLD_V=${2} # Old value to replace
    NEW_V=${3} # New value to be the replacement of the configuration
    CONFIG_FILE=${4}


    echo -e "${YELLOW}Configuring combination '${DENOTATION} = ${NEW_V}'...${NO_COLOR}"

    NEW_COMBINATION_CONTENT=$(sed "s/${OLD_V}/${NEW_V}/g" "${CONFIG_FILE}")
    echo "${NEW_COMBINATION_CONTENT}" > "${CONFIG_FILE}"
}


# Function:
#   - Runs the visualization script with the currently configured settings
#
# Arguments:
#   - ARG 1: The denotation that distinguishes the current combination (is 
#            important for the terminal debugging, as it allows the developer to
#            view the current combination that is being processed)
#
#   - ARG 2: The current value in the config-file that was recently substituted
#            with the old value in 'configureCombination()'. In this function, it
#            has no significance for the execution itself. Just as the first
#            argument, it's only satisfactory for debugging purposes
#
#   - ARG 3: The specification of what charts that will be visualized
#
visualizeCombination() {
    DENOTATION=${1}
    CURR_V=${2} # Current configuration to run the visualization on
    CHARTS_TO_VISUALIZE=${3}

    echo -e "${YELLOW}Visualizing combination '${DENOTATION} = ${CURR_V}'...${NO_COLOR}"

    # Run system on current combinatorial selection of configurations
    ./"4. data-visualization.sh" "${CHARTS_TO_VISUALIZE}"

    echo -e "${GREEN}Combination '${DENOTATION} = ${CURR_V}' successfully visualized${NO_COLOR}"
}