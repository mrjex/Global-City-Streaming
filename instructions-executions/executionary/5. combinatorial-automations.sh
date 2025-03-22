#####     5. COMBINATORIAL AUTOMATIONS     #####

#   - Runs all concievable combinations of configurations of the data-visualization attributes in
#     the central 'configuration.yml' file. In essence, this is the main script (the high-level
#     structure that obtains the entrypoint of the developer) of all the "5."* shell scripts.
#     All of these scripts have in common that they manipulate the content of 'configuration-yml'
#     to then run the system based on the new manipualted values. This is what is referred as a
#     combination, namely a unique sequence of configuration and output.



###   DEVELOPER CONFIGURATION SECTION   ###


##  EXCLUSION/INCLUSION OF GROUPED COMBINATIONS SECTION  ##
#   - Turning any boolean variable to false indicates that all of the related combination-executions
#     will be dismissed once the developer runs this shell script.

RUN_EQUATOR_COMBINATIONS="False"
RUN_PIE_COMBINATIONS="True"
RUN_BUBBLE_COMBINATIONS="False"


# Import external script-modules
CONFIG_FILE="../../configuration.yml"
source ./"5. equator-combinations.sh"
source ./"5. pieChart-combinations.sh"
source ./"5. bubbleChart-combinations.sh"




# Store the content of the original configurations from the .yml file in a variable
ORIGINAL_CONFIG_FILE_CONTENT=$(cat "${CONFIG_FILE}")


# Override the combinatorial executions and modifications to the config file with it's original
# content (all of its obtained values prior to executing this script)
restoreOriginalConfigurations() {
    echo "${ORIGINAL_CONFIG_FILE_CONTENT}" > "${CONFIG_FILE}"
}


# Function:
# Checks for matching substrings in the given input file and
# returns the entire row of the matching string. The use case
# of this function is to get the rows of specific attributes
# to split them and access the developer's inputted configuration
#
# Arguments:
#   - ARG 1: The substring that the row to-be returned must contain.
#            In the context of this script, it is an attribute inside
#            'configuration.yml'
#
getConfigurationValue() {
    SUBSTRING_QUERY=${1}

    MATCHING_ROW=$(grep -w "${SUBSTRING_QUERY}" ../../configuration.yml)

    ROW_SPLIT=(${MATCHING_ROW//:/ }) # Split by the stereotypical .yml delimiter ':'
    echo "${ROW_SPLIT[1]}"
}



##  MAIN SECTION ##



if [ "${RUN_EQUATOR_COMBINATIONS}" == "True" ]; then

    QUERY_ATTRIBUTE=$(getConfigurationValue "queryAttribute")
    QUERY_REQUIREMENT=$(getConfigurationValue "queryRequirement")

    runEquatorCombinations "${QUERY_ATTRIBUTE}" "${QUERY_REQUIREMENT}"
fi



if [ "${RUN_PIE_COMBINATIONS}" == "True" ]; then

    CHART_TYPE=$(getConfigurationValue "chartType")
    COLOR_THEME=$(getConfigurationValue "pieColorTheme")

    runPieCombinations "${CHART_TYPE}" "${COLOR_THEME}"
fi


if [ "${RUN_BUBBLE_COMBINATIONS}" == "True" ]; then

    SEPARATE_GRAPH_DISPLAY=$(getConfigurationValue "separateGraphDisplay")
    COLOR_THEME=$(getConfigurationValue "bubbleColorTheme")

    runBubbleCombinations "${SEPARATE_GRAPH_DISPLAY}" "${COLOR_THEME}"
fi



restoreOriginalConfigurations