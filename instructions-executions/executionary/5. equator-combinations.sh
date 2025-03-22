#####     5. EQUATOR COMBINATIONS     #####

#   - Runs all of the specified configuration-combinations of the selected sub-topic
#     in 'configuration.yml'. If, for instance, you as a developer selected 'continent'
#     as the 'queryAttribute', you would then run '5. combinatorial-automations.sh' that
#     forwards the flow to this script, that has the responsibility to run all possible
#     'continent' combinations. Since all of the existing continents, according to the
#     public Weather API (used in /application/apis/weatherApi.py) are "Europe", "Asia",
#     "Africa", "America" and "Antarctica", this script would consequently manipulate
#     'configuration.yml' 5 times and execute the system with all each continent selected.
#     Note that, besides 'continent', the two other sub-topics are 'timeZoneOffset' and
#     'none'.


CONFIG_FILE="../../configuration.yml"
source ./"5. utils.sh"

NO_COLOR='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'


# Function:
#   - Adds a character in the first index of a string such that all the
#     pre-existing characters are shifted to index (i + 1)
#
# Arguments:
#   - ARG 1: The input string that constiture (n - 1) characters of the final output string
#   - ARG 2: The character to prepend at index 0
prependCharacterInString() {
    INPUT_STR=${1}
    PREPEND_CHARACTER=${2}

    echo ${INPUT_STR/#/$PREPEND_CHARACTER}
}


# Function:
#   - This function iterates over the possible timezone offset values ranging from
#     UTC-6 to UTC+6 and runs the system with each value configured in a separate
#     and isolated manner. Running the system on the current value requires 2 steps:
#       
#       1) Configure value            -->   Manipulate given file with the value
#       2) Visualize combination      -->   Forward dataflow to the visualzing scripts
#
# My Comment:
#   - Note that this function could have been refactored to 'runUtilsCombinations' in
#     utils.sh, if an array of the values 'UTC-6', ..., 'UTC+0', ..., 'UTC+6' was declared.
#     Despite this, I wanted to try the addition arithmetic operator and prepending '+' to
#     construct the current element in a for-loop, for the sake of improving my Bash skills
#           --> runUtilsCombinations()
#
runAllEquatorTimezoneOffsetCombinations() {
    QUERY_REQUIREMENT=${1} # The initial value to replace

    END="6"
    START="-6"
    START_VAL="UTC${START}"

    configureCombination "timeZoneOffset" "${QUERY_REQUIREMENT}" "${START_VAL}" "${CONFIG_FILE}"
    visualizeCombination "timeZoneOffset" "${START_VAL}" "equatorChart=True"

    START=$((START + 1))

    CURR_TO="-5" # Current Timezone Offset
    PREV_TO="-6" # Previous TImezone Offset


    # From -5 to 6
    for i in $(seq ${START} ${END});
    do

        # If the 'i' is greater or equal to 0, then prepend '+' infront of the corresponding string
        if [ "${i}" -ge 0 ]; then
            CURR_TO=$(prependCharacterInString "${i}" '+')
        else
            CURR_TO=${i}
        fi

        PREV_IDX=$(expr $i - 1)

        if [ "${PREV_IDX}" -ge 0 ]; then
            PREV_TO=$(prependCharacterInString "${PREV_IDX}" '+')
        else
            PREV_TO=${PREV_IDX}
        fi

        configureCombination "timeZoneOffset" "${PREV_TO}" "${CURR_TO}" "${CONFIG_FILE}"
        visualizeCombination "timeZoneOffset" "${CURR_TO}" "equatorChart=True"
    done
}


# Function:
#   - Only runs 1 combination, since applying no filter implies operating with entire database
#
runEquatorNoFilterCombination() {
    echo -e "${YELLOW} Visualizing equator chart with filter = 'none'...${NO_COLOR}"
    ./"4. data-visualization.sh" "equatorChart=True"

    echo -e "${GREEN} Visualized equator chart with filter = 'none'...${NO_COLOR}"
}


# Function:
#   - The entry point of this script that is invoked from '5. combinatorial-automations.sh'.
#     It serves as the gateway that forwards the request to the selected group of related
#     query-combinatory code
#
# Arguments:
#   - ARG 1: String     -->     The value of 'queryAttribute' in the central file 'configuration.yml'
#   - ARG 2: String     -->     The value of 'queryRequirement' in the file 'configuration.yml'
#
runEquatorCombinations() {
    QUERY_ATTRIBUTE=${1}
    QUERY_REQUIREMENT=${2}
    

    if [ "${RUN_ALL_EQUATOR_QUERIES}" == "True" ]; then
        echo "run all"
    else
        if [ "${QUERY_ATTRIBUTE}" == "continent" ]; then

            declare -a CONTINENTS=("Europe" "Asia" "America" "Africa" "Atlantic")
            CONTINENTS_ARR_ARG=$(echo "${CONTINENTS[@]}" | tr " " ",")

            runUtilsCombinations "${CONFIG_FILE}" "${QUERY_REQUIREMENT}" "${CONTINENTS_ARR_ARG}" "${QUERY_ATTRIBUTE}" "equatorChart=True"

        elif [ "${QUERY_ATTRIBUTE}" == "timeZoneOffset" ]; then
            runAllEquatorTimezoneOffsetCombinations "${QUERY_REQUIREMENT}"
        else
            runEquatorNoFilterCombination
        fi
    fi
}