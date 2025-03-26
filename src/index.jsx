/*** APP ***/
import React, { useState, Suspense } from "react";
import { MockedProvider } from "@apollo/client/testing";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import {
    ApolloError,
  gql,
  useQuery,
  useSuspenseQuery,
} from "@apollo/client";

import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, hasRetried: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <button onClick={() => {
        this.setState({ hasError: false, hasRetried: true })
      }}>
        Retry
      </button>
    }

    if (this.state.hasRetried){
      alert("Remounting. Another alert should appear to indicate that a network request was made.");
    }

    return this.props.children;
  }
}

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
    }
  }
`;

const SuspenseExample= function() {
  const { data } = useSuspenseQuery(ALL_PEOPLE);
  return JSON.stringify(data);
}

const NonSuspenseExampleInner = function({ retry }) {
  const { data, error } = useQuery(ALL_PEOPLE);
  
  if (error) {
      return <button onClick={() => {
      alert("Remounting. Another alert should appear to indicate that a network request was made.");
        retry()
      }}>
        Retry
      </button>
  }

  return JSON.stringify(data);
}

const NonSuspenseExample = function() {
  const [key, setKey] = useState(0);
  return <NonSuspenseExampleInner key={key} retry={() => {
    setKey(key + 1);
  }}/>
}

function Provider ({ children }) {
  const [key, setKey] = useState(0);

  return <>
    <button onClick={() => setKey(key + 1)}>Reset</button>
    <MockedProvider key={key} mocks={
    // Error first, then success
    [
      {
        request: {
          query: ALL_PEOPLE,
        },
        error: new ApolloError({ graphQLErrors: [
          {
            path: "people",
            message: "bad thing",
          }
        ] })
      },
      {
        request: {
          query: ALL_PEOPLE,
        },
        result: () => {
          alert("I made a network request. Hooray!");

          return {
          data: {
            people: [
              {
                id: "1",
                name: "Ralf"
              }
            ]
         }}}}
  ]}>
    <>
    {children}
  </>
  </MockedProvider>
    </>
}


function App() {
  return <>
    <h1>Suspense example</h1>
    <Provider>
    <ErrorBoundary>
    <Suspense fallback={null}>
    <SuspenseExample />
    </Suspense>
    </ErrorBoundary>
    </Provider>

    <h1>Non-Suspense example</h1>
    <Provider><NonSuspenseExample /></Provider>
  </>
}


const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <App />
);
