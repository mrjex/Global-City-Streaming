#####     4. REAL-TIME CHARTS     #####


#   - Generates csvs from the PostgresSQL database
#   - Plots the data to charts (BubbleChart & PieChart)


# Run script:
# ./"4. data-visualization.sh" "equatorChart={BOOLEAN}" "realTimeCharts={BOOLEAN}"
# Note that 'BOOLEAN' is either 'True' or 'False', starting with a capital letter


# Function:
#   - Checks the passed arguments and flags to define what charts will be visualized
#     during runtime
#
# Example Arguments:
#   - "equatorChart=True"
#   - "realTimeCharts=True"
#   - "equatorChart=True" "realTimeCharts=False"
#   - "realTimeCharts=True" "equatorChart=False"
#   - "realTimeCharts=True" "equatorChart=True"
#
# No Arguments Passed:
#   - Automatically set to false
#   - Thus, the these relationships hold true:
#       - "equatorChart=True" "realTimeCharts=False"    =   "equatorChart=True"
#       - "realTimeCharts=True"                         =   "realTimeCharts=True" "equatorChart=False"
#       - ""                                            =   "realTimeCharts=False" "equatorChart=False"
#
#   - Use '-b' or '-p' if only wanting to display ONE of the realTimeCharts
configurePassedArgs() {
    CONTAINS_REALTIME_ARG_FLAG="False" # Control if the deloper inputs '-b' for bubbleChart or '-p' for pieChart

    # Iterate over all passed arguments
    for ARG in "$@"
    do
        ARG_SPLIT=(${ARG//=/ }) # Split by the stereotypical .yml delimiter ':'

        if [ "${ARG_SPLIT[0]}" == "equatorChart" ]; then
            EQUATOR_CHART="${ARG_SPLIT[1]}"

        elif [ "${ARG_SPLIT[0]}" == "realTimeCharts" ]; then
            REAL_TIME_CHARTS="${ARG_SPLIT[1]}"
        fi

        if [ "${ARG}" == "-b" ] || [ "${ARG}" == "-p" ]; then
            CONTAINS_REALTIME_ARG_FLAG="True"
            REAL_TIME_FLAG=${ARG}
        fi
    done


    # Check if the variables' lengths are 0 or not. If they are 0 it means
    # that they weren't assigned in the for-loop above (i.e the developer)
    # didn't pass "equatorChart={BOOLEAN}" or "realTimeCharts={BOOLEAN}" as
    # arguments to the execution of this script. If any argument isn't found,
    # we default the corresponding chart to 'False', as to not display it
    if [ "${#EQUATOR_CHART}" == "0" ]; then
        EQUATOR_CHART="False"
    elif [ "${#REAL_TIME_CHARTS}" == "0" ]; then
        REAL_TIME_CHARTS="False"
    fi
}



##  COLOR SECTION  ##
NO_COLOR='\033[0m'
YELLOW='\033[1;33m'



##  FORWARDING SECTION  ##

#   - Runs the corresponding shell scripts in /debug-api where the essential .py scripts
#     are located. This forwarding is necessary to preserve simplistic file paths


# Visualize BubbleChart & PieChart
forwardRequestSQL() {
    ./realTimeCharts.sh "${1}"
}

# Visualize EquatorChart
forwardRequestEquator() {
    ./equatorChart.sh
}



## MAIN SECTION  ##

configurePassedArgs "$@"
cd ../../debug-api



if [ "${CONTAINS_REALTIME_ARG_FLAG}" == "True" ]; then
    forwardRequestSQL "${REAL_TIME_FLAG}"
fi


if [ "${REAL_TIME_CHARTS}" == "True" ]; then
    echo "gg"
    forwardRequestSQL "-b -p"
fi


if [ "${EQUATOR_CHART}" == "True" ]; then
    forwardRequestEquator
fi


if [ "${REAL_TIME_CHARTS}" == "False" ] && [ "${EQUATOR_CHART}" == "False" ]; then
    echo -e "${YELLOW}None of the charts are configured to be displayed. Set at least one to 'True'.${NO_COLOR}"
fi